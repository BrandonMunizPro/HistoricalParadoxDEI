extends RefCounted
## Original interpretive regional vegetation. Suitability is not ancient land-cover evidence.
var world
var roots={}
var local_roots={}
var meshes=[]
var coarse_meshes=[]
var arid_rocks=[]
var busy=false
var tree_count=0
var habitat=preload("res://habitat.gd")
var rock_material: StandardMaterial3D
var settings
var quality=preload("res://vegetation_quality.gd").new()
var tree_mesh_count=24
var work_profile={"maxChunkMs":0.0,"maxUploadMs":0.0,"cellsBuilt":0,"cancelled":0,"generationCpuMs":0.0,"uploadCpuMs":0.0,"generationYieldFrames":0,"candidates":0}

func expected_cells():
	var cells={}
	if world.distance>=200:return cells
	if world.distance<settings.scenery.local_transition_km[1]:
		var center=Vector2i(floori(world.focus.x/.05),floori(world.focus.y/.05))
		for dy in [-1,0,1]:
			for dx in [-1,0,1]:
				var c=center+Vector2i(dx,dy)
				cells["local|%d|%d" % [c.x,c.y]]=true
	if not world.contains(world.regional_manifest.bounds,world.focus.x,world.focus.y):
		for dy in [-1,0,1]:
			for dx in [-1,0,1]:cells["global|%d|%d" % [floori(world.focus.x)+dx,floori(world.focus.y)+dy]]=false
	else:
		for id in world.resident:
			if world.resident[id].descriptor.get("romaDetail",false):continue
			if world.resident[id].descriptor.kind=="regional":cells[id]=false
	return cells

func pending_cells():
	var pending=[]
	var expected=expected_cells()
	for id in expected:
		var group=local_roots if expected[id] else roots
		if not group.has(id) or not group[id].get_meta("ready",false):pending.append(id)
	return pending

func is_ready():
	return not busy and pending_cells().is_empty()

func _init(owner):
	world=owner
	settings=world.presentation.settings
	var factory=preload("res://canopy_assets.gd").new()
	for species in 6:
		for variant in 4:meshes.append(factory.build(species,variant))
	for species in 6:
		for variant in 4:coarse_meshes.append(factory.build(species,variant,true))
	for material in [meshes[0].surface_get_material(0),meshes[0].surface_get_material(1)]:
		var transition=settings.scenery.coarse_transition_km
		material.set_shader_parameter("coarse_transition_km",Vector2(transition[0],transition[1]))
		var local_transition=settings.scenery.local_transition_km
		material.set_shader_parameter("local_transition_km",Vector2(local_transition[0],local_transition[1]))
	rock_material=StandardMaterial3D.new()
	rock_material.albedo_color=Color("c0baa5")
	rock_material.albedo_texture=world.base_material.get_shader_parameter("quality_rock")
	rock_material.roughness=.98
	rock_material.vertex_color_use_as_albedo=true
	for variant in 4:
		var rock=boulder(variant);meshes.append(rock);coarse_meshes.append(rock)
		var arrays=rock.surface_get_arrays(0);var indices=PackedInt32Array()
		for i in range(0,arrays[Mesh.ARRAY_VERTEX].size(),3):indices.append_array(PackedInt32Array([i,i+2,i+1]))
		arrays[Mesh.ARRAY_INDEX]=indices
		var normals=arrays[Mesh.ARRAY_NORMAL]
		for i in normals.size():normals[i]=-normals[i]
		arrays[Mesh.ARRAY_NORMAL]=normals
		var solid=ArrayMesh.new();solid.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays);solid.surface_set_material(0,rock_material)
		arid_rocks.append(solid)
		meshes[24+variant]=solid;coarse_meshes[24+variant]=solid

func record_generation_chunk(begin):
	var elapsed=(Time.get_ticks_usec()-begin)/1000.0
	work_profile.maxChunkMs=max(work_profile.maxChunkMs,elapsed)
	work_profile.generationCpuMs+=elapsed

func boulder(variant):
	# Closed, original fractured outcrop: sloped planes rather than round pebbles.
	var rings=[]
	for level in 3:
		var ring=[]
		for side in 7:
			var angle=TAU*side/7
			var radius=(.007+variant*.001)*(1.0+.22*sin(side*3.7+variant))
			var taper=[1.0,1.05,.48][level]
			ring.append(Vector3(cos(angle)*radius*taper+level*.0015,[-.002,.004,.012][level]+sin(side*2.3+variant)*.0015,sin(angle)*radius*taper))
		rings.append(ring)
	var surface=SurfaceTool.new();surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	for level in 2:
		for side in 7:
			var next=(side+1)%7
			for p in [rings[level][side],rings[level+1][side],rings[level][next],rings[level][next],rings[level+1][side],rings[level+1][next]]:
				surface.set_uv(Vector2(p.x,p.z)*65);surface.add_vertex(p)
	for side in 7:
		var next=(side+1)%7
		for p in [Vector3(0,-.003,0),rings[0][side],rings[0][next],Vector3(.003,.012,0),rings[2][next],rings[2][side]]:
			surface.set_uv(Vector2(p.x,p.z)*65);surface.add_vertex(p)
	surface.generate_normals();surface.set_material(rock_material)
	return surface.commit()

func tree_mesh(species):
	var surface=SurfaceTool.new()
	surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	var bark=Color("655642")
	cone(surface,Vector3(0,.009,0),.0018,.018,bark,6,.0012)
	if species==0:
		for item in [[Vector3(0,.024,0),.012,.018],[Vector3(-.007,.020,.003),.009,.013],[Vector3(.006,.021,-.004),.010,.015]]:
			cone(surface,item[0],item[1],item[2],Color("425d35"),7,item[1]*.37)
	elif species==1:
		for j in 3:cone(surface,Vector3(0,.017+j*.009,0),.013-j*.003,.020,Color("284b3c"),7,0.0)
	else:
		cone(surface,Vector3(0,.026,0),.0055,.038,Color("3b5031"),7,.001)
	surface.generate_normals()
	var material=StandardMaterial3D.new()
	material.vertex_color_use_as_albedo=true
	material.vertex_color_is_srgb=true
	material.roughness=1
	material.metallic_specular=0
	material.cull_mode=BaseMaterial3D.CULL_DISABLED
	surface.set_material(material)
	return surface.commit()

func cone(surface,center,radius,height,color,sides,top):
	for i in sides:
		var a=TAU*i/sides;var b=TAU*(i+1)/sides
		var p=center+Vector3(cos(a)*radius,-height*.5,sin(a)*radius)
		var q=center+Vector3(cos(b)*radius,-height*.5,sin(b)*radius)
		var r=center+Vector3(cos(a)*top,height*.5,sin(a)*top)
		var s=center+Vector3(cos(b)*top,height*.5,sin(b)*top)
		surface.set_color(color.lightened(.035*cos(a)))
		for v in [p,r,q,q,r,s]:surface.add_vertex(v)

func tick():
	quality.update(world.distance,world.water_time)
	for material in [meshes[0].surface_get_material(0),meshes[0].surface_get_material(1)]:material.set_shader_parameter("camera_distance",world.distance)
	var global_keys=[]
	if not world.contains(world.regional_manifest.bounds,world.focus.x,world.focus.y) and world.distance<200:
		for dx in [-1,0,1]:
			for dy in [-1,0,1]:global_keys.append("global|%d|%d" % [floori(world.focus.x)+dx,floori(world.focus.y)+dy])
	for id in roots.keys():
		if (id.begins_with("global|") and not id in global_keys) or (not id.begins_with("global|") and not world.resident.has(id)):
			roots[id].queue_free()
			roots.erase(id)
	for id in roots:roots[id].visible=world.distance>settings.scenery.coarse_transition_km[0] and world.distance<190
	var local_keys=[]
	var cell=Vector2i(floori(world.focus.x/.05),floori(world.focus.y/.05))
	if world.distance<settings.scenery.local_transition_km[1]:
		for offset in [Vector2i(0,0),Vector2i(-1,0),Vector2i(1,0),Vector2i(0,-1),Vector2i(0,1),Vector2i(-1,-1),Vector2i(1,-1),Vector2i(-1,1),Vector2i(1,1)]:
			var c=cell+offset
			local_keys.append("local|%d|%d" % [c.x,c.y])
	for id in local_roots.keys():
		if not id in local_keys:
			local_roots[id].queue_free()
			local_roots.erase(id)
	if busy or world.distance>=200 or not world.queue.is_empty():return
	# All placements must use settled terrain, including close cells.
	for id in world.resident:
		if world.resident[id].reveal<1:return
	for id in local_keys:
		if local_roots.has(id):continue
		var split=id.split("|")
		var lon=float(split[1])*.05;var lat=float(split[2])*.05
		build(id,{"west":lon,"east":lon+.05,"south":lat,"north":lat+.05},true)
		return
	for id in global_keys:
		if roots.has(id):continue
		for tile in world.resident:
			if world.resident[tile].reveal<1:return
		var split=id.split("|")
		var lon=float(split[1]);var lat=float(split[2])
		build(id,{"west":lon,"east":lon+1,"south":lat,"north":lat+1})
		return
	for id in world.resident:
		if world.resident[id].descriptor.kind!="regional" or roots.has(id):continue
		if world.resident[id].reveal<1:return
		build(id)
		return

func build(id,local_bounds={},is_local=false):
	busy=true
	var root=Node3D.new()
	world.vegetation_root.add_child(root)
	if is_local:local_roots[id]=root
	else:roots[id]=root
	var b=local_bounds if not local_bounds.is_empty() else world.tiles[id].bounds
	var sparse_arid=world.presentation.north_africa((b.west+b.east)*.5,(b.south+b.north)*.5)>.5
	var arid=settings.north_africa
	var rng=RandomNumberGenerator.new()
	rng.seed=abs(id.hash())+278
	var batches=[]
	var colours=[]
	var customs=[]
	for i in meshes.size():batches.append([]);colours.append([]);customs.append([])
	var accepted=0
	var plants=0;var rocks=0
	var tuning=settings.scenery
	var chunk_begin=Time.get_ticks_usec()
	for i in int(tuning.attempts):
		# Footprint/terrain checks vary in cost. Retain the candidate-count cap,
		# and yield earlier when the measured CPU slice reaches its time budget.
		if i%int(tuning.yield_every)==0 or (i%8==0 and (Time.get_ticks_usec()-chunk_begin)/1000.0>=tuning.generation_budget_ms):
			record_generation_chunk(chunk_begin)
			work_profile.generationYieldFrames+=1
			await world.get_tree().process_frame
			chunk_begin=Time.get_ticks_usec()
		var group=local_roots if is_local else roots
		if not is_instance_valid(root) or not group.has(id) or group[id]!=root:
			work_profile.cancelled+=1;busy=false;return
		var lon=rng.randf_range(b.west,b.east);var lat=rng.randf_range(b.south,b.north)
		work_profile.candidates+=1
		if not world.is_land(lon,lat):continue
		var p=world.project(lon,lat)
		# Roma-only transition from the bounded authored hinterland into native cells.
		# Stable habitat noise avoids consuming RNG or changing other regions.
		if world.settlements!=null and world.settlements.roma_enabled and world.settlements.roma_visual.landscape.enabled:
			var c=world.settlements.roma_visual.center
			var radius=Vector2(p.x-c.x,p.z-c.z).length()
			if radius<1.6:
				if world.settlements.roma_visual.landscape.in_field(p-c) or habitat.noise(Vector2(p.x,p.z)*31)>smoothstep(.42,1.6,radius):continue
		if world.presentation.is_clear(Vector2(p.x,p.z)):continue
		var climate=world.presentation.climate(lon,lat)
		var weights=world.presentation.weights(lat,climate)
		var africa=world.presentation.north_africa(lon,lat)
		var wet=world.presentation.fertile_plain(climate,0.0)
		# Reject empty habitat before expensive rendered-terrain height queries.
		var density=0.0;var rock_rate=0.0
		for family in 4:
			density+=weights[family]*settings.families[family].density
			rock_rate+=weights[family]*settings.families[family].rock_rate
		var woodland=smoothstep(.25,.65,habitat.cover(Vector2(p.x,p.z),climate.g,climate.b,0))
		var plant_rate=min(.92,woodland*density*(tuning.local_density if is_local else tuning.coarse_density))
		var choice=rng.randf()
		if africa>0:
			plant_rate*=lerp(1.0,lerp(arid.dry_plant_multiplier,1.0,wet),africa)
			rock_rate*=lerp(1.0,arid.loose_rock_multiplier,africa)
			rock_rate*=lerp(1.0,smoothstep(.43,.74,habitat.noise(Vector2(p.x,p.z)*.35)),africa)
		if choice>=plant_rate+rock_rate:continue
		if climate.a>.02 and world.presentation.over_river(Vector2(p.x,p.z),lon,lat):continue
		var is_rock=choice>=plant_rate
		if is_rock and africa>.5 and wet>.35:continue
		if not is_local and not is_rock:
			var footprint=arid.footprint_km if sparse_arid else tuning.coarse_footprint_km
			if world.presentation.is_clear(Vector2(p.x,p.z),footprint):continue
			if climate.a>.02 and world.presentation.over_river(Vector2(p.x,p.z),lon,lat,footprint):continue
			var coast_clear=true
			for direction in [Vector2(1,0),Vector2(-1,0),Vector2(0,1),Vector2(0,-1),Vector2(.707,.707),Vector2(-.707,.707),Vector2(.707,-.707),Vector2(-.707,-.707)]:
				var offset=world.unproject(p+Vector3(direction.x*footprint,0,direction.y*footprint))
				if not world.is_land(offset.x,offset.y):coast_clear=false;break
			if not coast_clear:continue
		var h=world.elevation(lon,lat)
		if h<.003 or h>12.0:continue
		p.y=h
		var species=0;var size=1.0
		if not is_rock:
			if rng.randf()>1-smoothstep(1.8,2.7,h/1.5):continue
			var gradient_x=(world.elevation(lon+.001,lat)-h)/(.111195*max(.3,cos(deg_to_rad(lat))))
			var gradient_z=(world.elevation(lon,lat+.001)-h)/.111195
			var slope=1.0-1.0/sqrt(1.0+gradient_x*gradient_x+gradient_z*gradient_z)
			if rng.randf()>1-smoothstep(.15,.38,slope):continue
			var pick=rng.randf();var family=0
			while family<3 and pick>weights[family]:pick-=weights[family];family+=1
			size=rng.randf_range(settings.families[family].scale[0],settings.families[family].scale[1])
			if family==1:species=1 if h/1.5>1.1 or lat>50 else 3
			elif family==2:species=4
			elif family==3:species=5 if lat<36 and climate.b>.3 and rng.randf()<.65 else 3
			else:species=1 if h/1.5>1.4 else (2 if rng.randf()<.12 else 0)
			if rng.randf()<.20:size*=.5
			# Deliberate campaign-diorama canopy scale, not a measured tree height.
			size*=tuning.local_tree_scale if is_local else tuning.coarse_tree_scale
			if species==5 and is_local:size*=.65
			if africa>.5:
				species=5 if wet>.4 and climate.a>.08 and h<.45 else 4
				size*=arid.local_plant_scale if is_local else arid.coarse_plant_scale
			plants+=1
		else:
			species=6;size=rng.randf_range(.6,1.8);rocks+=1
			if africa>.5:
				# Fewer, larger outcrops only where existing height/slope supports them.
				var gx=(world.elevation(lon+.001,lat)-h)/(.111195*max(.3,cos(deg_to_rad(lat))))
				var gz=(world.elevation(lon,lat+.001)-h)/.111195
				if h<.25 and gx*gx+gz*gz<.002:
					rocks-=1;continue
				size*=2.5
		var dimensions=Vector3(size,size*rng.randf_range(.85,1.2),size)
		if is_rock:dimensions*=Vector3(1.4,.55,.85)
		var basis=Basis(Vector3.UP,rng.randf()*TAU).scaled(dimensions)
		var custom=Color(1 if not is_local and not is_rock else 0,1 if is_local and not is_rock else 0,0,0)
		if not is_local and not is_rock:
			# Shear the stand's footprint onto the actual rendered tangent plane.
			# Each instance origin and all geographical terrain remain unchanged.
			var gx=world.unproject(p+Vector3(.1,0,0));var gz=world.unproject(p+Vector3(0,0,.1))
			var gradient=Vector3((world.elevation(gx.x,gx.y)-h)/.1,0,(world.elevation(gz.x,gz.y)-h)/.1)
			custom.b=basis.x.dot(gradient)/dimensions.y;custom.a=basis.z.dot(gradient)/dimensions.y
		var variant=rng.randi_range(0,3)
		batches[species*4+variant].append(Transform3D(basis,p))
		var tint=Color(1,1,1)
		if is_rock:tint=Color(1.0-weights.y*.12,1.0-weights.z*.12,1.0-weights.z*.26)
		colours[species*4+variant].append(tint)
		customs[species*4+variant].append(custom)
		accepted+=1
		if accepted>=int(tuning.max_instances_per_cell):break
	record_generation_chunk(chunk_begin)
	var upload_begin=Time.get_ticks_usec()
	for species in meshes.size():
		if batches[species].is_empty():continue
		var mm=MultiMesh.new()
		mm.transform_format=MultiMesh.TRANSFORM_3D
		mm.use_colors=true
		mm.use_custom_data=true
		mm.mesh=meshes[species] if is_local or sparse_arid else coarse_meshes[species]
		if quality.contains((b.west+b.east)*.5,(b.south+b.north)*.5):
			var replacement=quality.mesh_for(species,not is_local and not sparse_arid)
			if replacement!=null:mm.mesh=replacement
		if sparse_arid and species>=tree_mesh_count:mm.mesh=arid_rocks[species-tree_mesh_count]
		mm.instance_count=batches[species].size()
		for i in mm.instance_count:
			mm.set_instance_transform(i,batches[species][i]);mm.set_instance_color(i,colours[species][i])
			mm.set_instance_custom_data(i,customs[species][i])
			if (i+1)%int(tuning.upload_yield_every)==0:
				work_profile.maxUploadMs=max(work_profile.maxUploadMs,(Time.get_ticks_usec()-upload_begin)/1000.0)
				work_profile.uploadCpuMs+=(Time.get_ticks_usec()-upload_begin)/1000.0
				await world.get_tree().process_frame
				var group=local_roots if is_local else roots
				if not is_instance_valid(root) or not group.has(id) or group[id]!=root:
					work_profile.cancelled+=1;busy=false;return
				upload_begin=Time.get_ticks_usec()
		var node=MultiMeshInstance3D.new()
		node.multimesh=mm
		if not is_local:node.extra_cull_margin=tuning.coarse_footprint_km
		node.visibility_range_end=tuning.local_visibility_km if is_local else tuning.coarse_visibility_km
		node.visibility_range_end_margin=tuning.local_fade_km if is_local else tuning.coarse_fade_km
		node.visibility_range_fade_mode=GeometryInstance3D.VISIBILITY_RANGE_FADE_SELF
		node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_ON if is_local else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		root.add_child(node)
		tree_count+=mm.instance_count
	root.set_meta("ready",true)
	root.set_meta("plants",plants);root.set_meta("rocks",rocks)
	work_profile.maxUploadMs=max(work_profile.maxUploadMs,(Time.get_ticks_usec()-upload_begin)/1000.0)
	work_profile.uploadCpuMs+=(Time.get_ticks_usec()-upload_begin)/1000.0
	work_profile.cellsBuilt+=1
	busy=false
	print("REGIONAL_SCENERY_READY ",id," asset_variants=28 plants=",plants," rocks=",rocks)

func resident_composition():
	var result={"plants":0,"rocks":0,"paletteVariants":meshes.size()}
	for group in [roots,local_roots]:
		for node in group.values():
			result.plants+=int(node.get_meta("plants",0));result.rocks+=int(node.get_meta("rocks",0))
	return result

func resident_vegetation():return resident_composition().plants

func resident_instances():
	var count=0
	for group in [roots,local_roots]:
		for node in group.values():
			for child in node.get_children():count+=child.multimesh.instance_count
	return count
