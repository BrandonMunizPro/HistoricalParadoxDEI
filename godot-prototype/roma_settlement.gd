extends RefCounted
## Roma-only art prototype. Preserves the geographical anchor and other settlements.
var world
var kit=preload("res://roma_architecture.gd").new()
var layout=[]
var lanes=[]
var stats={"archetypes":7,"buildings":0,"maxChunkMs":0.0,"buildMs":0.0,"lod":""}
var road_material
var center
var settings
var environment
var original_lighting
var original_shadow_opacity
var height_cache={}
var terrain_signature=""
var terrain_meshes=[]
var landscape
var showcase

func _init(owner):
	world=owner
	settings=world.read_json("data/roma-presentation.json")
	for child in world.get_children():
		if child is WorldEnvironment:environment=child.environment;break
	assert(environment!=null)
	original_lighting=Vector3(environment.ssao_radius,environment.ssao_intensity,world.sun.light_angular_distance)
	original_shadow_opacity=world.sun.shadow_opacity
	for site in world.sites:
		if site.key=="roma":center=world.project(site.lon,site.lat)
	plan()
	landscape=preload("res://roma_landscape.gd").new(self)
	if OS.get_cmdline_user_args().has("--roma-showcase") or OS.get_cmdline_user_args().has("--settlement-development") or OS.get_cmdline_user_args().has("--settlement-identities"):showcase=preload("res://roma_showcase.gd").new(self)

func lod(distance):
	return "close" if distance<settings.lod.close_km else ("strategic" if distance>=settings.lod.strategic_km else "regional")

func display_scale(distance):
	return clamp(distance/settings.lod.proxy_scale_distance_km,1.0,settings.lod.max_proxy_scale) if lod(distance)=="strategic" else 1.0

func record_chunk(begin):
	stats.maxChunkMs=max(stats.maxChunkMs,(Time.get_ticks_usec()-begin)/1000.0)

func update_lighting(enabled):
	var p=world.project(world.focus.x,world.focus.y)
	var rules=settings.lighting
	var weight=(1-smoothstep(rules.focus_inner_km,rules.focus_outer_km,Vector2(p.x-center.x,p.z-center.z).length()))*(1-smoothstep(rules.detail_near_km,rules.detail_far_km,world.distance)) if enabled else 0.0
	environment.ssao_radius=lerp(original_lighting.x,float(rules.ssao_radius_km),weight)
	environment.ssao_intensity=lerp(original_lighting.y,float(rules.ssao_intensity),weight)
	world.sun.light_angular_distance=lerp(original_lighting.z,float(rules.sun_angular_distance),weight)
	world.sun.shadow_opacity=lerp(float(original_shadow_opacity),float(rules.shadow_opacity),weight)
	stats["lightingWeight"]=weight
	if showcase!=null:
		environment.ambient_light_energy=lerp(.38,.34,weight)
		world.sun.light_angular_distance=0.0
		world.sun.shadow_opacity=lerp(float(original_shadow_opacity),.78,weight)
		world.sun.directional_shadow_mode=DirectionalLight3D.SHADOW_ORTHOGONAL if weight>.5 else DirectionalLight3D.SHADOW_PARALLEL_4_SPLITS
		if weight>.5:world.sun.directional_shadow_max_distance=1.2
		if OS.get_cmdline_user_args().has("--showcase-no-shadows"):world.sun.shadow_enabled=false

func plan():
	# Original illustrative street plan, not a surveyed footprint or street claims.
	var rng=RandomNumberGenerator.new();rng.seed=278
	var routes=[
		[Vector2(-.04,-.32),Vector2(-.065,-.16),Vector2(.012,.02),Vector2(.04,.15),Vector2(-.03,.32)],
		[Vector2(-.34,.035),Vector2(-.18,.015),Vector2(0,.02),Vector2(.17,-.025),Vector2(.33,-.10)],
		[Vector2(-.29,-.12),Vector2(-.13,-.10),Vector2(0,-.12),Vector2(.18,-.16),Vector2(.31,-.14)],
		[Vector2(-.29,.18),Vector2(-.14,.15),Vector2(0,.17),Vector2(.16,.14),Vector2(.31,.20)],
		[Vector2(-.22,-.25),Vector2(-.18,-.08),Vector2(-.13,.07),Vector2(-.20,.31)],
		[Vector2(.22,-.26),Vector2(.18,-.08),Vector2(.22,.06),Vector2(.16,.29)]]
	layout.append({"point":Vector3(-.055,0,-.055),"angle":0.0,"kind":6,"size":1.0})
	for route in routes:
		var points=[]
		for point in route:points.append(Vector3(point.x,0,point.y))
		lanes.append({"points":points,"width":.009 if lanes.size()>1 else .012})
	for lane in lanes:
		for segment in range(1,lane.points.size()):
			var a=lane.points[segment-1];var b=lane.points[segment]
			var direction=(b-a).normalized();var side=direction.cross(Vector3.UP)
			var count=maxi(1,floori(a.distance_to(b)/.035))
			for i in count:
				var along=(float(i)+.5)/count
				for bank in [-1.0,1.0]:
					var p=a.lerp(b,along)+side*bank*rng.randf_range(.022,.026)
					if p.distance_to(layout[0].point)<.070:continue
					if abs(p.x)<.045 and p.z>-.01 and p.z<.055:continue
					var intersects=false
					for prior in layout:
						if p.distance_to(prior.point)<.032:intersects=true;break
					# Keep every main street clear, not just this building's front.
					for other in lanes:
						for j in range(1,other.points.size()):
							var x=other.points[j-1];var d=other.points[j]-x
							if p.distance_to(x+d*clamp((p-x).dot(d)/d.length_squared(),0.,1.))<.016:intersects=true
					if intersects:continue
					var facing=-side*bank
					layout.append({"point":p,"angle":atan2(facing.x,facing.z)+rng.randf_range(-.07,.07),"kind":rng.randi_range(0,4),"size":rng.randf_range(.90,1.12)})
	# Two peripheral vernacular round structures; not an entire city of archaic huts.
	for p in [Vector3(-.285,0,.26),Vector3(.29,0,-.25)]:layout.append({"point":p,"angle":0.,"kind":5,"size":1.0})
	stats.buildings=layout.size()

func ground(point):
	var key=Vector2(point.x,point.z)
	if height_cache.has(key):return height_cache[key]
	var geo=world.unproject(center+point)
	var height=world.elevation(geo.x,geo.y)
	height_cache[key]=height
	return height

func create(distance):
	if showcase!=null and distance<60:return await showcase.create(distance)
	var begin=Time.get_ticks_usec()
	var terrain_key=str(world.resident.keys())+str(world.regional_active)
	if terrain_signature!=terrain_key:
		terrain_signature=terrain_key;height_cache.clear();terrain_meshes.clear()
	elif height_cache.size()>30000:height_cache.clear()
	await kit.prepare(world)
	var root=Node3D.new();root.name="RomaRepublicanPrototype"
	stats.lod=lod(distance)
	var near=stats.lod=="close";var strategic=stats.lod=="strategic"
	var scale_value=display_scale(distance)
	# Strategic uses the shared coarse kit (no tiles, windows or beam detail).
	# Keep footprints across LODs so buildings do not vanish at the boundary.
	var groups={};var contacts=[];var chunk=Time.get_ticks_usec()
	for i in layout.size():
		var b=layout[i]
		var p=center+b.point*scale_value
		var size=b.size*scale_value
		var floor_height=-INF;var low=INF
		var extent=.04 if b.kind==6 else .019
		for offset in [Vector3.ZERO,Vector3(-extent,0,-extent),Vector3(extent,0,-extent),Vector3(extent,0,extent),Vector3(-extent,0,extent)]:
			var h=ground(b.point*scale_value+offset*size)
			floor_height=max(floor_height,h);low=min(low,h)
		p.y=floor_height+.00015
		if landscape.enabled:p.y=ground(b.point*scale_value)+.00015
		if not groups.has(b.kind):groups[b.kind]=[]
		groups[b.kind].append(Transform3D(Basis(Vector3.UP,b.angle).scaled(Vector3.ONE*size),p))
		var footprints=[Vector2(.026,.026),Vector2(.012,.025),Vector2(.027,.019),Vector2(.025,.025),Vector2(.014,.029),Vector2(.014,.014),Vector2(.053,.063)]
		contacts.append({"center":p,"low":low,"extent":extent*size,"footprint":footprints[b.kind]*size,"angle":b.angle,"temple":b.kind==6})
		if Time.get_ticks_usec()-chunk>3000:
			stats.maxChunkMs=max(stats.maxChunkMs,(Time.get_ticks_usec()-chunk)/1000.0)
			await world.get_tree().process_frame;chunk=Time.get_ticks_usec()
	for kind in groups:
		var mm=MultiMesh.new();mm.transform_format=MultiMesh.TRANSFORM_3D
		mm.mesh=kit.library[kit.TYPES[kind]+str(near)];mm.instance_count=groups[kind].size()
		for i in mm.instance_count:mm.set_instance_transform(i,groups[kind][i])
		var node=MultiMeshInstance3D.new();node.multimesh=mm
		node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF if strategic else GeometryInstance3D.SHADOW_CASTING_SETTING_ON
		root.add_child(node)
		await world.get_tree().process_frame
	if not strategic and terrain_meshes.is_empty():
		# Roads conform to the existing rendered mesh; no terrain flattening.
		var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
		for lane in lanes:
			for i in range(1,lane.points.size()):
				var a=lane.points[i-1];var b=lane.points[i]
				var subdivisions=maxi(1,ceili(a.distance_to(b)/.012))
				for j in subdivisions:
					var p=a.lerp(b,float(j)/subdivisions);var q=a.lerp(b,float(j+1)/subdivisions)
					var side=(q-p).cross(Vector3.UP).normalized()*lane.width*.5
					quad_ground(st,p+side,p-side,q-side,q+side)
					if Time.get_ticks_usec()-chunk>3000:
						record_chunk(chunk);await world.get_tree().process_frame;chunk=Time.get_ticks_usec()
			if Time.get_ticks_usec()-chunk>3000:
				record_chunk(chunk);await world.get_tree().process_frame;chunk=Time.get_ticks_usec()
		# Broad, unroofed public space rather than an Imperial basilica/forum complex.
		for x in range(-5,5):
			for z in range(-3,5):
				var p=Vector3(x*.01,0,z*.01)
				quad_ground(st,p,p+Vector3(.01,0,0),p+Vector3(.01,0,.01),p+Vector3(0,0,.01),false)
			if Time.get_ticks_usec()-chunk>3000:
				record_chunk(chunk);await world.get_tree().process_frame;chunk=Time.get_ticks_usec()
		# Small terrain-conforming worn yards join the street frontage to its setting.
		for b in layout:
			var yard_begin=Time.get_ticks_usec()
			for i in 9:
				var a=float(i)*TAU/9;var z=float(i+1)*TAU/9
				var radius=.038 if b.kind==6 else .018*b.size
				var p=b.point+Vector3(cos(a),0,sin(a))*radius
				var q=b.point+Vector3(cos(z),0,sin(z))*radius
				for corner in [b.point,p,q]:
					st.set_normal(Vector3.UP);st.set_uv(Vector2(corner.x,corner.z)*1000)
					st.set_uv2(Vector2(.5 if corner==b.point else 0.0,0))
					st.add_vertex(center+Vector3(corner.x,ground(corner)+.0003,corner.z))
			stats["yardCpuMs"]=stats.get("yardCpuMs",0.0)+(Time.get_ticks_usec()-yard_begin)/1000.0
			if Time.get_ticks_usec()-chunk>3000:
				record_chunk(chunk);await world.get_tree().process_frame;chunk=Time.get_ticks_usec()
		st.generate_tangents()
		var streets=MeshInstance3D.new();streets.mesh=st.commit();streets.material_override=paths_material();streets.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		streets.visible=not landscape.enabled
		root.add_child(streets)
		terrain_meshes.append({"mesh":streets.mesh,"material":streets.material_override,"shadows":false,"show":not landscape.enabled})
		# Terrain-following foundation skirts fill slope gaps without moving geography.
		var stone=SurfaceTool.new();stone.begin(Mesh.PRIMITIVE_TRIANGLES)
		for c in contacts:
			var depth=max(.0003,c.center.y-c.low+.0003)
			var box=BoxMesh.new();box.size=Vector3(c.footprint.x,depth,c.footprint.y)
			var arrays=box.get_mesh_arrays()
			for index in arrays[Mesh.ARRAY_INDEX]:
				stone.set_normal(arrays[Mesh.ARRAY_NORMAL][index].rotated(Vector3.UP,c.angle));stone.set_uv(arrays[Mesh.ARRAY_TEX_UV][index])
				stone.add_vertex(arrays[Mesh.ARRAY_VERTEX][index].rotated(Vector3.UP,c.angle)+c.center-Vector3(0,depth*.5,0))
			if Time.get_ticks_usec()-chunk>3000:
				record_chunk(chunk);await world.get_tree().process_frame;chunk=Time.get_ticks_usec()
		var skirts=MeshInstance3D.new();skirts.mesh=stone.commit();skirts.material_override=kit.materials[2];root.add_child(skirts)
		terrain_meshes.append({"mesh":skirts.mesh,"material":skirts.material_override,"shadows":true})
		# A restrained tuff-wall fragment evokes attested Republican defences.
		# Its exact local alignment is illustrative, not a new canonical wall survey.
		var wall=SurfaceTool.new();wall.begin(Mesh.PRIMITIVE_TRIANGLES)
		for segment in 14:
			if landscape.enabled:break
			if segment in [6,7]:continue # Unmonumental gap for the approach lane.
			var p=Vector3(.345+sin(segment*.4)*.012,0,-.22+segment*.031)
			for course in 5:
				var h=ground(p)+course*.0012
				var block=BoxMesh.new();block.size=Vector3(.003,.00118,.0308)
				var a=block.get_mesh_arrays()
				for index in a[Mesh.ARRAY_INDEX]:
					wall.set_normal(a[Mesh.ARRAY_NORMAL][index]);wall.set_uv(a[Mesh.ARRAY_TEX_UV][index]);wall.set_color(Color(.65,.59,.45))
					wall.add_vertex(a[Mesh.ARRAY_VERTEX][index]+center+Vector3(p.x,h+.0006,p.z))
			if Time.get_ticks_usec()-chunk>3000:
				record_chunk(chunk);await world.get_tree().process_frame;chunk=Time.get_ticks_usec()
		if not landscape.enabled:
			var boundary=MeshInstance3D.new();boundary.mesh=wall.commit();boundary.material_override=kit.materials[0];root.add_child(boundary)
			terrain_meshes.append({"mesh":boundary.mesh,"material":boundary.material_override,"shadows":true})
	elif not strategic:
		for asset in terrain_meshes:
			var node=MeshInstance3D.new();node.mesh=asset.mesh;node.material_override=asset.material
			node.visible=asset.get("show",true)
			node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_ON if asset.shadows else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
			root.add_child(node)
	await landscape.attach(root,distance)
	root.set_meta("contacts",contacts)
	root.set_meta("lod",stats.lod)
	root.set_meta("archetypes",7)
	stats.buildMs=(Time.get_ticks_usec()-begin)/1000.0;stats["maxArchetypeMs"]=kit.max_prepare_ms
	stats["texturePreparationMs"]=kit.texture_prepare_ms
	stats["heightCacheEntries"]=height_cache.size()
	return root

func quad_ground(st,a,b,c,d,soft=true):
	var points=[a,b,c,a,c,d];var across=[0.0,1.0,1.0,0.0,1.0,0.0]
	for i in 6:
		var p=points[i]
		st.set_normal(Vector3.UP);st.set_uv(Vector2(p.x,p.z)*1000)
		st.set_uv2(Vector2(across[i] if soft else .5,0))
		st.add_vertex(center+Vector3(p.x,ground(p)+.00035,p.z))

func paths_material():
	if road_material!=null:return road_material
	road_material=ShaderMaterial.new();road_material.shader=load("res://roma_ground.gdshader")
	var image=Image.load_from_file("res://assets/foundation/rocky-ground.jpg");image.generate_mipmaps()
	road_material.set_shader_parameter("ground_color",ImageTexture.create_from_image(image))
	return road_material

