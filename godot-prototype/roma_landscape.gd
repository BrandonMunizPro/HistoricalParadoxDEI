extends RefCounted
## Roma hinterland artwork, not a road/land-use survey. Source elevations stay intact.
var city_ref:WeakRef
var city:
	get:return city_ref.get_ref()
var world
var settings
var routes=[]
var fields=[]
var assets=[]
var signature=""
var enabled=true
var stats={"trees":0,"approaches":0,"cultivatedPlots":0,"terrainPaint":true,"maxCpuSliceMs":0.0}
var chunk=0
func _init(owner):
	city_ref=weakref(owner);world=owner.world;settings=owner.settings.landscape
	enabled=not OS.get_cmdline_user_args().has("--roma-landscape-baseline")
	# First vertex is an existing street endpoint; no city street or house moves.
	for definition in settings.approaches:
		var points=[]
		for p in definition:points.append(Vector3(p[0],0,p[1]))
		routes.append(points)
	for f in settings.fields:fields.append({"center":Vector2(f[0],f[1]),"size":Vector2(f[2],f[3]),"angle":f[4],"kind":f[5]})
	stats.approaches=routes.size();stats.cultivatedPlots=fields.size()

func pause_if_needed():
	var elapsed=(Time.get_ticks_usec()-chunk)/1000.0
	if elapsed<settings.budget_ms:return
	stats.maxCpuSliceMs=max(stats.maxCpuSliceMs,elapsed)
	await world.get_tree().process_frame
	chunk=Time.get_ticks_usec()

func permitted(p):
	var geo=world.unproject(city.center+p)
	return world.is_land(geo.x,geo.y) and not world.presentation.over_river(Vector2(city.center.x+p.x,city.center.z+p.z),geo.x,geo.y,.018)

func in_field(p):
	for f in fields:
		var local=(Vector2(p.x,p.z)-f.center).rotated(-f.angle)
		if abs(local.x)<f.size.x*.53 and abs(local.y)<f.size.y*.53:return true
	return false

func finish(st,material,shadows=false):
	st.generate_tangents()
	var mesh=st.commit()
	assets.append({"mesh":mesh,"material":material,"shadows":shadows})

func build():
	chunk=Time.get_ticks_usec()
	# Ground/approaches are painted in the native terrain shader: no coplanar
	# field ribbons that can intersect fine DEM triangles or float above them.
	await wall()
	await vegetation()
	stats["cachedAssets"]=assets.size();stats["heightCacheEntries"]=city.height_cache.size()

func wall():
	var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
	# Joined, gently battered curtain; gate sits on the actual outgoing approach.
	for i in 62:
		var z=-.25+i*.008
		if abs(z-settings.gate_z_km)<settings.gate_width_km*.5+.004:continue
		var a=Vector3(.355+sin(z*5)*.004,0,z)
		var b=Vector3(.355+sin((z+.008)*5)*.004,0,z+.008)
		var h0=city.ground(a);var h1=city.ground(b)
		var low0=city.center+Vector3(a.x,h0-.0004,a.z);var low1=city.center+Vector3(b.x,h1-.0004,b.z)
		var up0=city.center+Vector3(a.x,h0+settings.wall_height_km,a.z);var up1=city.center+Vector3(b.x,h1+settings.wall_height_km,b.z)
		for side in [-1.0,1.0]:
			var points=[low0+Vector3(side*.0016,0,0),low1+Vector3(side*.0016,0,0),up1+Vector3(side*.0012,0,0),up0+Vector3(side*.0012,0,0)]
			var indices=[0,1,2,0,2,3] if side>0 else [0,2,1,0,3,2]
			for k in indices:
				st.set_normal(Vector3(side,.06,0).normalized());st.set_uv(Vector2(points[k].z,points[k].y)*1000);st.add_vertex(points[k])
		for p in [up0+Vector3(-.0012,0,0),up0+Vector3(.0012,0,0),up1+Vector3(.0012,0,0),up0+Vector3(-.0012,0,0),up1+Vector3(.0012,0,0),up1+Vector3(-.0012,0,0)]:
			st.set_normal(Vector3.UP);st.set_uv(Vector2(p.x,p.z)*1000);st.add_vertex(p)
		for at_start in [true,false]:
			var adjacent=z-.008 if at_start else z+.008
			if not ((at_start and i==0) or (not at_start and i==61) or abs(adjacent-settings.gate_z_km)<settings.gate_width_km*.5+.004):continue
			var low=low0 if at_start else low1;var top=up0 if at_start else up1
			var cap=[low+Vector3(-.0016,0,0),low+Vector3(.0016,0,0),top+Vector3(.0012,0,0),top+Vector3(-.0012,0,0)]
			for k in ([0,1,2,0,2,3] if at_start else [0,2,1,0,3,2]):
				st.set_normal(Vector3(0,0,-1 if at_start else 1));st.set_uv(Vector2(cap[k].x,cap[k].y)*1000);st.add_vertex(cap[k])
		await pause_if_needed()
	var m=ShaderMaterial.new();m.shader=load("res://roma_stone.gdshader")
	m.set_shader_parameter("stone",world.base_material.get_shader_parameter("quality_rock"))
	finish(st,m,true)

func vegetation():
	var rng=RandomNumberGenerator.new();rng.seed=278042
	var batches={}
	for i in int(settings.tree_attempts):
		if i%16==0:await pause_if_needed()
		var p=Vector3(rng.randf_range(-1.35,1.35),0,rng.randf_range(-1.35,1.35))
		var radius=Vector2(p.x,p.z).length()
		var density=smoothstep(.34,.7,radius)*(1-smoothstep(1.1,1.6,radius))
		var clump=(sin(p.x*12+sin(p.z*8))*.5+.5)*.65+.15
		if rng.randf()>density*clump or not permitted(p):continue
		var blocked=in_field(p) or (abs(p.x-.355)<.026 and abs(p.z)<.28)
		for route in routes:
			for j in range(1,route.size()):
				var d=route[j]-route[j-1]
				if p.distance_to(route[j-1]+d*clamp((p-route[j-1]).dot(d)/d.length_squared(),0.,1.))<.018:blocked=true
		if blocked:continue
		var pick=rng.randf();var species=0 if pick<.6 else (2 if pick<.78 else 3)
		var index=species*4+rng.randi_range(0,3)
		if not batches.has(index):batches[index]=[]
		var scale_value=Vector3.ONE*rng.randf_range(.55,1.0)
		scale_value.y*=rng.randf_range(.8,1.2)
		p.y=city.ground(p)
		batches[index].append(Transform3D(Basis(Vector3.UP,rng.randf()*TAU).scaled(scale_value),city.center+p))
		stats.trees+=1
		await pause_if_needed()
	for index in batches:
		var mm=MultiMesh.new();mm.transform_format=MultiMesh.TRANSFORM_3D;mm.use_custom_data=true;mm.mesh=world.scenery.meshes[index];mm.instance_count=batches[index].size()
		for i in mm.instance_count:
			mm.set_instance_transform(i,batches[index][i]);mm.set_instance_custom_data(i,Color(0,1,0,0))
		assets.append({"multimesh":mm,"shadows":true})
		await pause_if_needed()

func attach(root,distance):
	if not enabled or distance>=settings.visible_distance_km:return
	var key=city.terrain_signature
	if signature!=key:
		signature=key;assets.clear();stats.trees=0
		await build()
	for a in assets:
		var node
		if a.has("multimesh"):
			node=MultiMeshInstance3D.new();node.multimesh=a.multimesh
		else:
			node=MeshInstance3D.new();node.mesh=a.mesh;node.material_override=a.material
		node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_ON if a.shadows and distance<12 else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		root.add_child(node)
	city.stats["landscape"]=stats.duplicate(true)

