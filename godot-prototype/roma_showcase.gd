extends RefCounted
## Opt-in, Roma-only art candidate; no campaign state or canonical coordinates.
const DIR="res://assets/roma-showcase/"
var city_ref:WeakRef
var city:
	get:return city_ref.get_ref()
var world
var layout=[]
var meshes={}
var ground_mesh
var paving_mesh
var geometry_cache={}
var pads={}
var ground_material
var edge_material
var last_terrain=""
var stats={"candidate":"Roma district v1","structures":0,"trees":0,"originalMeshKit":true}
var rng=RandomNumberGenerator.new()
var composition
var development
var development_pads=[]
var development_composition={}
var road_segments=PackedVector4Array()
var road_widths=PackedFloat32Array()
var surface_heights=[]
const HALF=.26
const GRID=130
func _init(owner):
	city_ref=weakref(owner);world=owner.world;rng.seed=2782026
	composition=world.read_json("data/roma-showcase-district.json")
	var identities=OS.get_cmdline_user_args().has("--settlement-identities")
	if identities:composition=world.read_json("data/settlement-identity-layouts.json").roma
	if OS.get_cmdline_user_args().has("--settlement-development") or identities:
		development_composition=world.read_json("data/roma-development-composition.json")
		var catalog=world.read_json("data/settlement-development-catalog.json")
		for start in world.read_json("data/settlement-development-starts.json").settlements:
			for site in world.sites:
				if site.key=="roma" and start.settlementId==site.id:
					development=preload("res://settlement_development.gd").new(catalog,start)
		if identities:development=world.get_meta("identity_models").roma;development_composition=world.read_json("data/settlement-identity-composition.json")
		assert(development!=null,"No configured starting development for Roma")
		assert(development.validate(world.sites.map(func(s):return s.id)).is_empty())
		world.set_meta("settlement_development",development)
		for slot in development.settlement.slots:
			if slot.building==null:continue
			var a=development.resolve_visual(slot.building.chain,3)
			if not a.is_empty():development_pads.append({"slot":slot,"asset":a,"center":Vector3(slot.anchorM[0]*.001,0,slot.anchorM[1]*.001),"angle":deg_to_rad(slot.yawDegrees),"half":Vector2(a.footprintM[0],a.footprintM[1])*.0005})
		var ui=preload("res://settlement_development_ui.gd").new();world.add_child(ui);ui.setup(development,world)
	var coverage=Vector3(city.center.x,city.center.z,.210)
	world.base_material.set_shader_parameter("roma_showcase_ground",coverage)
	world.base_material.set_shader_parameter("roma_landscape_rect",Vector4.ZERO)
	world.regional_node.material_override.set_shader_parameter("roma_showcase_ground",coverage)
	world.regional_node.material_override.set_shader_parameter("roma_landscape_rect",Vector4.ZERO)
	for entry in world.resident.values():
		entry.node.material_override.set_shader_parameter("roma_showcase_ground",coverage)
		entry.node.material_override.set_shader_parameter("roma_landscape_rect",Vector4.ZERO)
	plan()
func plan():
	for group in composition.groups:
		for p in group.placements:
			var replaced=false
			for entry in development_composition.get("replace",[]):
				if entry.kind==group.kind and entry.anchorM[0]==p[0] and entry.anchorM[1]==p[1]:replaced=true
			if replaced:continue
			var point=Vector3(p[0]*.001,0,p[1]*.001)
			for entry in development_composition.get("relocate",[]):
				if entry.kind==group.kind and entry.fromM[0]==p[0] and entry.fromM[1]==p[1]:point=Vector3(entry.toM[0]*.001,0,entry.toM[1]*.001)
			add(group.kind,point,deg_to_rad(p[2]),p[3])
	for route in composition.roads:
		for i in range(1,route.points.size()):
			var a=route.points[i-1];var b=route.points[i]
			road_segments.append(Vector4(a[0],a[1],b[0],b[1]));road_widths.append(route.width)
	if development!=null:
		for route in development_composition.roads:
			road_segments.append(Vector4(route.a[0],route.a[1],route.b[0],route.b[1]));road_widths.append(route.width)
	assert(road_segments.size()<=32,"Surface shader road capacity")
	stats.structures=layout.size()
	stats.candidate="Roma composed precinct v2"
func add(kind,p,angle,scale_value):
	var key=Vector2i(floori(p.x/.025),floori(p.z/.025))
	var b={"kind":kind,"point":p,"angle":angle,"scale":scale_value}
	if OS.get_cmdline_user_args().has("--settlement-identities"):
		var bounds=mesh(kind).get_aabb();b["half"]=Vector2(max(abs(bounds.position.x),abs(bounds.end.x)),max(abs(bounds.position.z),abs(bounds.end.z)))*scale_value
	layout.append(b)
	if not pads.has(key):pads[key]=[]
	pads[key].append(b)
func source(p):return city.ground(p)
func surface(p):
	var h=source(p);var key=Vector2i(floori(p.x/.025),floori(p.z/.025))
	for dx in range(-1,2):
		for dz in range(-1,2):
			for b in pads.get(key+Vector2i(dx,dz),[]):
				if b.kind=="temple":continue
				var d=Vector2(p.x-b.point.x,p.z-b.point.z)
				var half=b.get("half",Vector2(.010,.012))
				if b.has("half"):d=d.rotated(b.angle)
				var edge=max(abs(d.x)/half.x,abs(d.y)/half.y)
				if edge<1.35:h=lerp(h,source(b.point),1-smoothstep(.8,1.35,edge))
	# Small constructed temple terrace, blended into source relief at its edges.
	var d=Vector2(p.x+.055,p.z+.055)
	var edge=max(abs(d.x)/.036,abs(d.y)/.042)
	if edge<1.25:h=lerp(h,source(Vector3(-.055,0,-.055)),1-smoothstep(.95,1.25,edge))
	if development!=null:
		for pad in development_pads:
			var center=pad.center
			var q=Vector2(p.x-center.x,p.z-center.z).rotated(pad.angle)
			var size_value=pad.half+Vector2.ONE*.0015
			var extent=max(abs(q.x)/size_value.x,abs(q.y)/size_value.y)
			if extent<1.25:h=lerp(h,source(center),1-smoothstep(1.,1.25,extent))
	return h+.00045
func mesh(kind):
	if not meshes.has(kind):
		var identity="res://assets/settlement-identities/"+kind+".res"
		meshes[kind]=load(identity if OS.get_cmdline_user_args().has("--settlement-identities") and ResourceLoader.exists(identity) else DIR+kind+".res")
	return meshes[kind]
func proxy_scale(distance):
	if development==null:return city.display_scale(distance)
	var rule=development_composition.strategicProxy
	return lerp(1.,float(rule.maxScale),smoothstep(rule.startDistanceKm,rule.fullDistanceKm,distance))
func grounded_origin(point,angle,scale_value,bounds,distance):
	var proxy=proxy_scale(distance);var origin=city.center+point*proxy
	if distance<15:origin.y=surface(point);return origin
	# Coarse map symbols clear the rendered terrain at all footprint corners.
	# Sampling only the centre can bury a facade in coarse strategic relief.
	var floor_height=source(point*proxy)
	for x in [bounds.position.x,bounds.end.x]:
		for z in [bounds.position.z,bounds.end.z]:
			var local=Vector3(x,0,z).rotated(Vector3.UP,angle)*scale_value*proxy
			floor_height=max(floor_height,source(point*proxy+local))
	origin.y=floor_height+development_composition.strategicProxy.minimumClearanceM*.001
	return origin
func material():
	if ground_material!=null:return ground_material
	ground_material=ShaderMaterial.new();ground_material.shader=load("res://roma_showcase_ground.gdshader")
	for name in ["ground_color","ground_normal","ground_roughness"]:ground_material.set_shader_parameter(name,load(DIR+name.replace("_","-")+".jpg"))
	ground_material.set_shader_parameter("gravel_color",load(DIR+"gravel-color.jpg"))
	for name in ["path_color","path_normal","path_roughness"]:ground_material.set_shader_parameter(name,load(DIR+name.replace("_","-")+".jpg"))
	ground_material.set_shader_parameter("road_segments",road_segments)
	ground_material.set_shader_parameter("road_widths",road_widths)
	ground_material.set_shader_parameter("road_count",road_segments.size())
	return ground_material
func edge():
	if edge_material==null:
		edge_material=material().duplicate();edge_material.shader=load("res://roma_showcase_edge.gdshader")
	return edge_material
func ground_color(p):
	var wear=0.0
	for b in layout:
		var d=Vector2(p.x-b.point.x,p.z-b.point.z).rotated(-b.angle)
		var extent=Vector2(.012,.016)*b.scale
		if b.kind=="temple":extent=Vector2(.034,.039)
		var edge=max(abs(d.x)/extent.x,abs(d.y)/extent.y)
		wear=max(wear,1-smoothstep(.9,1.4,edge))
	var plaza=1-smoothstep(1.0,1.12,max(abs(p.x+.047)/.031,abs(p.z-.033)/.041))
	if development!=null:
		for pad in development_pads:
			var q=Vector2(p.x-pad.center.x,p.z-pad.center.z).rotated(pad.angle)
			var extent=pad.half
			var yard=1-smoothstep(.9,1.2,max(abs(q.x)/extent.x,abs(q.y)/extent.y))
			wear=max(wear,yard)
			if pad.slot.building.chain=="civic-forum":plaza=max(plaza,yard*.65)
	return Color(wear,plaza,0,1-smoothstep(.215,.252,Vector2(p.x,p.z).length()))
func terrain():
	var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var size_value=HALF*2;var count=GRID;var step=size_value/count
	var heights=[];var cols=[]
	for iz in count+1:
		var row=[];var colors=[]
		for ix in count+1:
			var p=Vector3(-HALF+ix*step,0,-HALF+iz*step);row.append(surface(p));colors.append(ground_color(p))
		heights.append(row);cols.append(colors)
		if iz%6==0:await world.get_tree().process_frame
	for iz in count:
		for ix in count:
			for offset in [Vector2i(0,0),Vector2i(1,0),Vector2i(0,1),Vector2i(1,0),Vector2i(1,1),Vector2i(0,1)]:
				var x=ix+offset.x;var z=iz+offset.y
				st.set_uv(Vector2(float(x)/count,float(z)/count));st.set_color(cols[z][x]);st.add_vertex(Vector3(-HALF+x*step,heights[z][x],-HALF+z*step))
		if iz%5==0:await world.get_tree().process_frame
	st.generate_normals();st.generate_tangents();st.index();ground_mesh=st.commit();surface_heights=heights
func rendered_surface(p):
	if surface_heights.is_empty():return surface(p)
	var u=clamp((p.x+HALF)/(HALF*2)*GRID,0.0,GRID-.0001);var v=clamp((p.z+HALF)/(HALF*2)*GRID,0.0,GRID-.0001)
	var x=floori(u);var z=floori(v);var a=u-x;var b=v-z
	var h0=surface_heights[z][x];var h1=surface_heights[z][x+1];var h2=surface_heights[z+1][x];var h3=surface_heights[z+1][x+1]
	return h0+(h1-h0)*a+(h2-h0)*b if a+b<=1 else h3+(h2-h3)*(1-a)+(h1-h3)*(1-b)
func create(distance):
	city.stats.buildings=layout.size();city.stats.archetypes=15;city.stats.lod=city.lod(distance)
	var begin=Time.get_ticks_msec();var root=Node3D.new();root.name="RomaAuthoredDistrictCandidate"
	# The precinct lies wholly inside the Roma detail tile. Unrelated distant
	# residents must not invalidate this static local surface on every zoom.
	var signature="fine" if world.resident.has("roma-local") else ("parent" if world.resident.has("N41E12") else "backdrop")
	if last_terrain!=signature:
		last_terrain=signature;ground_mesh=null;paving_mesh=null;surface_heights=[];city.height_cache.clear()
		if geometry_cache.has(signature):
			var cached=geometry_cache[signature];ground_mesh=cached.ground;paving_mesh=cached.paving;surface_heights=cached.heights;city.height_cache=cached.samples.duplicate()
	var groups={}
	var proxy=proxy_scale(distance)
	for b in layout:
		var p=city.center+b.point*proxy;p.y=surface(b.point) if distance<20 else source(b.point*proxy)+.0002
		if development!=null:p=grounded_origin(b.point,b.angle,b.scale,mesh(b.kind).get_aabb(),distance)
		if not groups.has(b.kind):groups[b.kind]=[]
		groups[b.kind].append(Transform3D(Basis(Vector3.UP,b.angle).scaled(Vector3.ONE*b.scale*proxy),p))
	for kind in groups:
		var mm=MultiMesh.new();mm.transform_format=MultiMesh.TRANSFORM_3D;mm.mesh=mesh(kind+("-far" if distance>=3 else ""));mm.instance_count=groups[kind].size()
		for i in mm.instance_count:mm.set_instance_transform(i,groups[kind][i])
		var node=MultiMeshInstance3D.new();node.multimesh=mm;node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_ON if distance<15 else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;root.add_child(node)
		await world.get_tree().process_frame
	if distance<15:
		if ground_mesh==null:await terrain()
		var ground=MeshInstance3D.new();ground.mesh=ground_mesh;ground.material_override=material();ground.position=Vector3(city.center.x,0,city.center.z);ground.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;root.add_child(ground)
		var fringe=MeshInstance3D.new();fringe.mesh=ground_mesh;fringe.material_override=edge();fringe.position=ground.position;fringe.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;root.add_child(fringe)
		await trees(root,distance)
		if not OS.get_cmdline_user_args().has("--settlement-identities"):
			if paving_mesh==null:
				var paving=SurfaceTool.new();paving.begin(Mesh.PRIMITIVE_TRIANGLES);paving.set_material(load(DIR+"tuff.tres"))
				var points=mesh("paving").get_faces()
				for j in 4:
					for v in points:
						var p=Vector3(v.x-.064+j*.006,0,v.z-.019);p.y=rendered_surface(p)+v.y+.00008
						paving.set_uv(Vector2(p.x,p.z)*500);paving.add_vertex(p)
					await world.get_tree().process_frame
				paving.generate_normals();paving.generate_tangents();paving.index();paving_mesh=paving.commit()
			var pn=MeshInstance3D.new();pn.mesh=paving_mesh;pn.position=Vector3(city.center.x,0,city.center.z);pn.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;root.add_child(pn)
		# Continuous tuff curtain, with an unmonumental opening on the east approach.
		var transforms=[]
		for definition in composition.walls if development==null else []:
			var p=Vector3(definition[0]*.001,0,definition[1]*.001);var h=source(p)
			transforms.append(Transform3D(Basis(Vector3.UP,deg_to_rad(definition[2])),city.center+Vector3(p.x,h,p.z)))
		var mm=MultiMesh.new();mm.transform_format=MultiMesh.TRANSFORM_3D;mm.mesh=mesh("wall");mm.instance_count=transforms.size()
		for i in mm.instance_count:mm.set_instance_transform(i,transforms[i])
		var node=MultiMeshInstance3D.new();node.multimesh=mm;root.add_child(node)
		if development!=null:development_walls(root)
	if development!=null:
		var view=preload("res://settlement_development_view.gd").new();view.name="DevelopmentSlots";root.add_child(view);view.setup(development,city,distance)
	if ground_mesh!=null and not geometry_cache.has(signature):
		if geometry_cache.size()>=2:
			for key in geometry_cache.keys():
				if key!="fine":geometry_cache.erase(key);break
		geometry_cache[signature]={"ground":ground_mesh,"paving":paving_mesh,"heights":surface_heights,"samples":city.height_cache.duplicate()}
	stats["buildWallMs"]=Time.get_ticks_msec()-begin;stats["cachedSurfaceModes"]=geometry_cache.size()
	stats["lod"]="authored-district" if distance<15 else "district-silhouette"
	city.stats["showcase"]=stats.duplicate(true)
	root.set_meta("contacts",[]);root.set_meta("lod",city.lod(distance));root.set_meta("archetypes",15)
	return root
func development_walls(root):
	# Joined boundary curtain, draped continuously; deliberate approach opening.
	var path=development_composition.wallPathM.map(func(p):return Vector2(p[0],p[1]))
	var transforms=[]
	for i in range(1,path.size()):
		var a=path[i-1];var b=path[i];var delta=b-a;var count=ceili(delta.length()/15.8)
		for j in count:
			if i==int(development_composition.gate.segment) and development_composition.gate.omitLastPiece and j==count-1:continue
			var midpoint=a+delta*(j+.5)/count;var p=Vector3(midpoint.x*.001,0,midpoint.y*.001)
			var endpoint0=a+delta*j/count;var endpoint1=a+delta*(j+1.)/count
			var h0=source(Vector3(endpoint0.x*.001,0,endpoint0.y*.001));var h1=source(Vector3(endpoint1.x*.001,0,endpoint1.y*.001))
			var direction=Vector3(delta.x*.001/count,h1-h0,delta.y*.001/count)
			var axis=direction.normalized();var right=Vector3.UP.cross(axis).normalized();var up=axis.cross(right).normalized()
			var basis=Basis(right,up,axis).scaled_local(Vector3(1,1,direction.length()/.0168))
			p.y=(h0+h1)*.5+.0003;transforms.append(Transform3D(basis,city.center+p))
	var mm=MultiMesh.new();mm.transform_format=MultiMesh.TRANSFORM_3D;mm.mesh=mesh("wall");mm.instance_count=transforms.size()
	for i in transforms.size():mm.set_instance_transform(i,transforms[i])
	var node=MultiMeshInstance3D.new();node.multimesh=mm;root.add_child(node)
func trees(root,distance):
	rng.seed=278525;var groups={};var count=0
	for definition in composition.trees:
		var p=Vector3(definition[0]*.001,0,definition[1]*.001)
		var kind="tree-"+str(rng.randi_range(0,3));var s=definition[2]
		p.y=rendered_surface(p)
		if not groups.has(kind):groups[kind]=[]
		groups[kind].append(Transform3D(Basis(Vector3.UP,rng.randf()*TAU).scaled(Vector3.ONE*s),city.center+p));count+=1
	for kind in groups:
		var mm=MultiMesh.new();mm.transform_format=MultiMesh.TRANSFORM_3D;mm.mesh=mesh(kind+("-far" if distance>=3 else ""));mm.instance_count=groups[kind].size()
		for i in mm.instance_count:mm.set_instance_transform(i,groups[kind][i])
		var node=MultiMeshInstance3D.new();node.multimesh=mm;root.add_child(node);await world.get_tree().process_frame
	stats.trees=count
