extends RefCounted
## Small adapter from a composition to the existing asynchronous MultiMesh owner.
const Planner=preload("res://settlement_composition.gd")
var catalog
var definition
var meshes={}
var requested={}
var world
var center
var samples={}
var surface_active_ms=0.
var surface_longest_ms=0.
var surface_chunk_start=0
func pause_frame():await world.get_tree().process_frame
func yield_surface():
	var elapsed=(Time.get_ticks_usec()-surface_chunk_start)/1000.
	surface_longest_ms=max(surface_longest_ms,elapsed)
	if elapsed>2.:
		await pause_frame();surface_chunk_start=Time.get_ticks_usec()
func _init(catalog_path="res://data/settlement-composition-catalog.json",layout_path="res://data/neapolis-composition.json"):
	catalog=JSON.parse_string(FileAccess.get_file_as_string(catalog_path))
	definition=JSON.parse_string(FileAccess.get_file_as_string(layout_path))
	for item in catalog.archetypes.values():
		for path in [item.near,item.far]:
			if requested.has(path):continue
			assert(ResourceLoader.load_threaded_request(path)==OK);requested[path]=true
func _notification(what):
	if what==NOTIFICATION_PREDELETE:
		for path in requested:
			if not meshes.has(path) and ResourceLoader.load_threaded_get_status(path) in [ResourceLoader.THREAD_LOAD_IN_PROGRESS,ResourceLoader.THREAD_LOAD_LOADED]:ResourceLoader.load_threaded_get(path)
func sample_ground(p):
	if samples.has(p):return samples[p]
	var geo=world.unproject(center+Vector3(p.x,0,p.y))
	var result={"land":world.is_land(geo.x,geo.y),"height":world.elevation(geo.x,geo.y)}
	samples[p]=result;return result
func mesh_for(path):
	if not meshes.has(path):
		while ResourceLoader.load_threaded_get_status(path)==ResourceLoader.THREAD_LOAD_IN_PROGRESS:await world.get_tree().process_frame
		assert(ResourceLoader.load_threaded_get_status(path)==ResourceLoader.THREAD_LOAD_LOADED)
		var mesh=ResourceLoader.load_threaded_get(path)
		if path.begins_with("res://assets/neapolis-free/"):
			mesh=mesh.duplicate()
			for i in mesh.get_surface_count():
				var mat=mesh.surface_get_material(i)
				if mat is StandardMaterial3D and mat.albedo_texture!=null:
					mat=mat.duplicate();mat.albedo_texture=null;mat.albedo_color=Color("a96f50");mesh.surface_set_material(i,mat)
		meshes[path]=mesh
	return meshes[path]
func batch(owner,mesh,transforms,colors,label):
	var mm=MultiMesh.new();mm.transform_format=MultiMesh.TRANSFORM_3D;mm.use_colors=true;mm.mesh=mesh;mm.instance_count=transforms.size()
	for i in transforms.size():mm.set_instance_transform(i,transforms[i]);mm.set_instance_color(i,colors[i])
	var child=MultiMeshInstance3D.new();child.name=label;child.multimesh=mm;child.cast_shadow=owner.cast_shadow;owner.add_child(child)
	return child
func attach(node,owner,far):
	var started=Time.get_ticks_usec();world=owner;samples.clear()
	center=node.get_meta("composition_center")
	var plan=await Planner.plan(catalog,definition,Callable(self,"sample_ground"),Callable(self,"pause_frame"))
	var planning_ms=plan.timing.activeMs
	var groups={};var foundations=[];var foundation_colors=[];var triangles=0;var submissions=0;var categories={}
	var longest=plan.timing.longestChunkMs;var active=planning_ms;var wait_ms=0.;var chunk=Time.get_ticks_usec()
	var stair_count=0
	for b in plan.buildings:
		var path=b.far if far else b.near
		if not groups.has(path):groups[path]={"transforms":[],"colors":[]}
		var p=center+Vector3(b.position.x,b.ground.height+.00005,b.position.y)
		groups[path].transforms.append(Transform3D(Basis(Vector3.UP,b.angle).scaled(Vector3.ONE*b.scale),p));groups[path].colors.append(b.tint)
		categories[b.category]=categories.get(b.category,0)+1
		# Low stone plinth fills the sampled relief; the terrain is never flattened.
		# Skirts extend below the lowest sample, so there is no floating underside.
		var depth=b.ground.height-b.ground.low+.0003
		foundations.append(Transform3D(Basis(Vector3.UP,b.angle).scaled(Vector3(b.footprint.x*.94,depth,b.footprint.y*.94)),center+Vector3(b.position.x,b.ground.low+depth*.5-.00025,b.position.y)))
		foundation_colors.append(Color("a99b80"))
		var access=plan.paths.filter(func(route):return route.id==b.access)[0]
		stair_count+=access_steps(access,b.ground.height,foundations,foundation_colors)
		if Time.get_ticks_usec()-chunk>2000:
			var elapsed=(Time.get_ticks_usec()-chunk)/1000.;active+=elapsed;longest=max(longest,elapsed)
			await pause_frame();chunk=Time.get_ticks_usec()
	var assembled=(Time.get_ticks_usec()-chunk)/1000.;active+=assembled;longest=max(longest,assembled)
	for path in groups:
		var waiting=Time.get_ticks_usec();var mesh=await mesh_for(path);wait_ms+=(Time.get_ticks_usec()-waiting)/1000.
		var begin=Time.get_ticks_usec()
		batch(node,mesh,groups[path].transforms,groups[path].colors,path.get_file().get_basename())
		submissions+=mesh.get_surface_count()
		for surface in mesh.get_surface_count():triangles+=mesh.surface_get_array_index_len(surface)/3*groups[path].transforms.size()
		var elapsed=(Time.get_ticks_usec()-begin)/1000.;active+=elapsed;longest=max(longest,elapsed)
		await world.get_tree().process_frame
	var foundation=BoxMesh.new();var material=StandardMaterial3D.new();material.vertex_color_use_as_albedo=true;material.vertex_color_is_srgb=true;material.roughness=.98;foundation.material=material
	batch(node,foundation,foundations,foundation_colors,"GroundContactPlinths");submissions+=1;triangles+=12*foundations.size()
	var surface=await terrain_surface(plan,far)
	var child=MeshInstance3D.new();child.name="ConnectedStreetsAgoraAndDrains";child.mesh=surface;child.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;node.add_child(child)
	active+=surface_active_ms;longest=max(longest,surface_longest_ms)
	submissions+=1;triangles+=surface.surface_get_array_index_len(0)/3
	node.multimesh.visible_instance_count=0
	node.set_meta("composition",plan)
	node.set_meta("neapolis_geometry",{"compositionVersion":1,"detail":"far" if far else "near","buildings":plan.buildings.size(),"categories":categories,"roads":plan.roads.size(),"paths":plan.paths.size(),"agora":plan.agoraValid,"stairSteps":stair_count,"rejected":plan.rejected,"instancedTriangles":triangles,"mainPassSurfaceGroups":submissions,"batchNodes":node.get_child_count(),"planningMs":planning_ms,"surfaceActiveMs":surface_active_ms,"longestActiveChunkMs":longest,"attachActiveCpuMs":active,"assetWaitMs":wait_ms,"attachWallMs":(Time.get_ticks_usec()-started)/1000.})
	# The original neutral slots stay available for reversibility/audits.
	var original=[]
	for i in node.multimesh.instance_count:original.append(node.multimesh.get_instance_transform(i));original.append(node.multimesh.get_instance_color(i))
	node.set_meta("neapolis_slot_hash",var_to_bytes(original).hex_encode().sha256_text())
func access_steps(path,floor_height,transforms,colors):
	var direction=(path.b-path.a).normalized();var run=min(.006,path.a.distance_to(path.b)-.001)
	if run<=.0005:return 0
	var start=path.a+direction*run;var start_height=sample_ground(start).height
	var rise=floor_height-start_height
	if rise<.0003:return 0
	var count=ceili(rise/.0002);var angle=atan2(direction.x,direction.y)
	for i in count:
		var p=start-direction*run*(float(i)+.5)/count
		var top=lerp(start_height,floor_height,float(i+1)/count)+.00005
		var low=min(sample_ground(p).height,start_height)-.0003
		transforms.append(Transform3D(Basis(Vector3.UP,angle).scaled(Vector3(.0024,max(.00015,top-low),run/count+.00002)),center+Vector3(p.x,(top+low)*.5,p.y)))
		colors.append(Color("b9a98b"))
	return count
func terrain_surface(plan,far):
	surface_active_ms=0.;surface_longest_ms=0.
	surface_chunk_start=Time.get_ticks_usec()
	var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
	# Worn household yards and the sanctuary precinct connect roofs to urban ground.
	for building in plan.buildings:
		var rect=Planner.bounds(building).grow(.006)
		await patch(st,rect.position,rect.size,Color(.56,.50,.38,.65),.00008,true)
	for road in plan.roads:
		var begin=Time.get_ticks_usec();ribbon(st,road.a,road.b,road.width,Color("ad9a78"),.00010);record_surface(begin)
		await yield_surface()
	for path in plan.paths:
		var begin=Time.get_ticks_usec();ribbon(st,path.a,path.b,path.width,Color("ad9a78"),.00011);record_surface(begin)
		await yield_surface()
	if plan.agoraValid:
		var a=plan.agora
		await patch(st,a.position-a.footprint*.5,a.footprint,Color("c4b292"),.00014)
	# Narrow open edge drains are a visual convention, not a hydraulic simulation.
	if not far:
		for road in plan.roads:
			var begin=Time.get_ticks_usec()
			var side=Vector2(-(road.b-road.a).y,(road.b-road.a).x).normalized()*(road.width*.5-.0005)
			ribbon(st,road.a+side,road.b+side,.0006,Color("776f5b"),.00018)
			record_surface(begin);await yield_surface()
	var begin=Time.get_ticks_usec()
	st.index();var mesh=st.commit()
	var m=ShaderMaterial.new();m.shader=load("res://settlement_composition_ground.gdshader");mesh.surface_set_material(0,m)
	record_surface(begin);return mesh
func record_surface(begin):
	var elapsed=(Time.get_ticks_usec()-begin)/1000.;surface_active_ms+=elapsed;surface_longest_ms=max(surface_longest_ms,elapsed)
func ribbon(st,a,b,width,color_value,lift):
	var side=Vector2(-(b-a).y,(b-a).x).normalized()*width*.5
	var steps=maxi(1,ceili(a.distance_to(b)/.004))
	for i in steps:
		var p=a.lerp(b,float(i)/steps);var q=a.lerp(b,float(i+1)/steps)
		quad(st,[p-side,p+side,q+side,q-side],color_value,lift,[Vector2(0,.5),Vector2(1,.5),Vector2(1,.5),Vector2(0,.5)])
func patch(st,start,size,color_value,lift,soft=false):
	var nx=ceili(size.x/.008);var nz=ceili(size.y/.008)
	for x in nx:
		var begin=Time.get_ticks_usec()
		for z in nz:
			var p=start+Vector2(size.x*x/nx,size.y*z/nz);var delta=Vector2(size.x/nx,size.y/nz)
			var tint=color_value*(.98+float(posmod(x*17+z*31,5))*.01);tint.a=color_value.a
			var points=[p,p+Vector2(0,delta.y),p+delta,p+Vector2(delta.x,0)]
			var uv2s=[]
			for point in points:uv2s.append((point-start)/size if soft else Vector2(.5,.5))
			quad(st,points,tint,lift,uv2s)
		record_surface(begin);await yield_surface()
func quad(st,points,color_value,lift,uv2s=[Vector2(.5,.5),Vector2(.5,.5),Vector2(.5,.5),Vector2(.5,.5)]):
	for p in points:
		if not sample_ground(p).land:return
	# Correct winding for either ribbon direction.
	if (points[1]-points[0]).cross(points[2]-points[0])<0:points.reverse();uv2s.reverse()
	for index in [0,1,2,0,2,3]:
		var p=points[index];st.set_normal(Vector3.UP);st.set_uv(p*1000.);st.set_uv2(uv2s[index]);st.set_color(color_value);st.add_vertex(center+Vector3(p.x,sample_ground(p).height+lift,p.y))
