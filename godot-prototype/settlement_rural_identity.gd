extends RefCounted
## Generic sparse settlement adapter for configured minor identities.
var world
var center
var showcase:
	get:return self
var state
var composition
var cache={}
var signature=""
var pads=[]
var ground_mesh
var ground_material
var surface_heights=[]
func _init(owner,site,model,layout):
	world=owner;center=world.project(site.lon,site.lat);state=model;composition=layout
	for slot in state.settlement.slots:
		if slot.building==null:continue
		var asset=state.resolve_visual(slot.building.chain,3)
		if not asset.is_empty():pads.append({"center":Vector3(slot.anchorM[0]*.001,0,slot.anchorM[1]*.001),"half":Vector2(asset.footprintM[0],asset.footprintM[1])*.0005+Vector2.ONE*.002,"angle":deg_to_rad(slot.yawDegrees)})
	var coverage=Vector3(center.x,center.z,.125)
	world.base_material.set_shader_parameter("minor_identity_ground",coverage);world.regional_node.material_override.set_shader_parameter("minor_identity_ground",coverage)
	for entry in world.resident.values():entry.node.material_override.set_shader_parameter("minor_identity_ground",coverage)
func ground(p):
	var key=Vector2(p.x,p.z)
	if not cache.has(key):
		var geo=world.unproject(center+p);cache[key]=world.elevation(geo.x,geo.y)
	return cache[key]
func surface(p):
	var h=ground(p)
	for pad in pads:
		var origin=pad.center
		var q=Vector2(p.x-origin.x,p.z-origin.z).rotated(pad.angle)
		var half=pad.half
		var e=max(abs(q.x)/half.x,abs(q.y)/half.y)
		if e<1.3:h=lerp(h,ground(origin),1-smoothstep(1.,1.3,e))
	return h+.0006
func proxy_scale(distance):return lerp(1.,4.,smoothstep(15.,30.,distance))
func grounded_origin(point,angle,scale_value,bounds,distance):
	var proxy=proxy_scale(distance);var origin=center+point*proxy
	if distance<15:origin.y=surface(point);return origin
	var height=ground(point*proxy)
	for x in [bounds.position.x,bounds.end.x]:
		for z in [bounds.position.z,bounds.end.z]:height=max(height,ground(point*proxy+Vector3(x,0,z).rotated(Vector3.UP,angle)*scale_value*proxy))
	origin.y=height+.001;return origin
func create(distance):
	var next=str(world.resident.keys())+str(world.regional_active)
	if next!=signature:signature=next;cache.clear();ground_mesh=null
	var root=Node3D.new();root.name="AuthoredRuralIdentity"
	var proxy=proxy_scale(distance)
	for group in composition.groups:
		var mesh=load("res://assets/settlement-identities/"+group.kind+("-far" if distance>=3 else "")+".res")
		var mm=MultiMesh.new();mm.transform_format=MultiMesh.TRANSFORM_3D;mm.mesh=mesh;mm.instance_count=group.placements.size()
		for i in group.placements.size():
			var p=group.placements[i];var local=Vector3(p[0]*.001,0,p[1]*.001);var angle=deg_to_rad(p[2])
			mm.set_instance_transform(i,Transform3D(Basis(Vector3.UP,angle).scaled(Vector3.ONE*p[3]*proxy),grounded_origin(local,angle,p[3],mesh.get_aabb(),distance)))
		var node=MultiMeshInstance3D.new();node.multimesh=mm;root.add_child(node)
	if distance<15:
		if ground_mesh==null:build_ground()
		for edge in [false,true]:
			var ground=MeshInstance3D.new();ground.mesh=ground_mesh;ground.position=Vector3(center.x,0,center.z)
			var material=ground_material.duplicate();material.shader=load("res://roma_showcase_edge.gdshader" if edge else "res://roma_showcase_ground.gdshader");ground.material_override=material;ground.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;root.add_child(ground)
		add_roads(root)
		for i in composition.trees.size():
			var p=composition.trees[i];var local=Vector3(p[0]*.001,0,p[1]*.001)
			var node=MeshInstance3D.new();node.mesh=load("res://assets/roma-showcase/tree-"+str(i%4)+".res");node.position=center+local;node.position.y=surface(local);node.scale=Vector3.ONE*p[2];root.add_child(node)
	var view=preload("res://settlement_development_view.gd").new();view.name="DevelopmentSlots";root.add_child(view);view.setup(state,self,distance)
	return root
func build_ground():
	var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES);var grid=72
	surface_heights=[]
	for z in grid+1:
		var row=[]
		for x in grid+1:row.append(surface(Vector3(-.15+x*.3/grid,0,-.15+z*.3/grid)))
		surface_heights.append(row)
	for z in grid:
		for x in grid:
			for q in [Vector2(x,z),Vector2(x+1,z),Vector2(x,z+1),Vector2(x+1,z),Vector2(x+1,z+1),Vector2(x,z+1)]:
				var p=Vector3(-.15+q.x*.3/grid,0,-.15+q.y*.3/grid);p.y=surface_heights[int(q.y)][int(q.x)]
				st.set_color(Color(0,0,0,1-smoothstep(.126,.146,Vector2(p.x,p.z).length())));st.set_uv(Vector2(p.x,p.z)*1000);st.add_vertex(p)
	st.generate_normals();st.generate_tangents();st.index();ground_mesh=st.commit()
	ground_material=ShaderMaterial.new();ground_material.shader=load("res://roma_showcase_ground.gdshader")
	for stem in ["ground","path"]:
		for channel in ["color","normal","roughness"]:ground_material.set_shader_parameter(stem+"_"+channel,load("res://assets/roma-showcase/"+stem+"-"+channel+".jpg"))
	ground_material.set_shader_parameter("gravel_color",load("res://assets/roma-showcase/gravel-color.jpg"))
func rendered_surface(p):
	if surface_heights.is_empty() or abs(p.x)>.14999 or abs(p.z)>.14999:return surface(p)
	var u=clamp((p.x+.15)/.3*72,0.,71.9999);var v=clamp((p.z+.15)/.3*72,0.,71.9999)
	var x=floori(u);var z=floori(v);var a=u-x;var b=v-z
	var h0=surface_heights[z][x];var h1=surface_heights[z][x+1];var h2=surface_heights[z+1][x];var h3=surface_heights[z+1][x+1]
	return h0+(h1-h0)*a+(h2-h0)*b if a+b<=1 else h3+(h2-h3)*(1-a)+(h1-h3)*(1-b)
func add_roads(root):
	var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
	for route in composition.roads:
		for i in range(1,route.points.size()):
			var a=Vector3(route.points[i-1][0]*.001,0,route.points[i-1][1]*.001);var b=Vector3(route.points[i][0]*.001,0,route.points[i][1]*.001)
			var steps=ceili(a.distance_to(b)/.001);var side=(b-a).cross(Vector3.UP).normalized()*route.width*.0005
			for j in steps:
				var p=a.lerp(b,float(j)/steps);var q=a.lerp(b,float(j+1)/steps)
				for v in [p+side,p-side,q+side,p-side,q-side,q+side]:
					v.y=rendered_surface(v)+.0002;st.set_normal(Vector3.UP);st.set_uv(Vector2(v.x,v.z)*400);st.add_vertex(center+v)
	st.generate_normals();st.generate_tangents();var node=MeshInstance3D.new();node.mesh=st.commit()
	var material=StandardMaterial3D.new();material.albedo_texture=load("res://assets/roma-showcase/path-color.jpg");material.albedo_color=Color(.85,.79,.65);material.roughness=.95;node.material_override=material;node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;root.add_child(node)
