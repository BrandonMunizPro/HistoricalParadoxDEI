extends Node3D
## Renderer only. No campaign state or historical data is written by this project.
const RADIUS = 6371.0088
const ORIGIN = Vector2(13.5,41.5)
var manifest = {}
var sites = []
var research = []
var tiles = {}
var resident = {}
var desired = []
var base_material: ShaderMaterial
var water_material: ShaderMaterial
var camera: Camera3D
var sun: DirectionalLight3D
var target = Vector3.ZERO
var focus = Vector2(13.0,37.0)
var distance = 5200.0
var goal_distance = 5200.0
var yaw = 0.0
var pitch = 62.0
var goal_focus = Vector2(13.0,37.0)
var selected = ""
var markers = []
var marker_root: Node3D
var vegetation_root: Node3D
var city_root: Node3D
var research_root: Node3D
var status: Label
var selection_label: Label
var search: LineEdit
var site_list: ItemList
var frame_times = []
var startup_ms = 0
var tick = 0.0
var started = Time.get_ticks_msec()
var capture_name = ""
var capture_frame = 0
var capture_dir = "res://evidence"
var capture_done = false
var research_enabled = false
var loading_ms = []
var ready_frame = 0
var hydrology = {}
var queue = []
var context_node: MeshInstance3D
var last_family = ""
var ui_panel: PanelContainer
var city_batches={}
var scene_environment: Environment
var last_frame_usec=0
var all_frame_times=[]
var initial_view="overview"
var regional_river: MeshInstance3D
var river_signature=""
var regional_manifest={}
var regional_node: MeshInstance3D
var regional_heights=PackedFloat32Array()
var regional_land: Image
var regional_textures={}
var regional_active=false
var scenery
var strategic_regional_rivers: MeshInstance3D
var strategic_world_rivers: MeshInstance3D
var comparison_camera={}
var global_manifest={}
var global_textures={}
var global_land: Image
var global_ecology: Image
var mesh_cache={}
var mesh_cache_building=false
var settled_frame_times=[]
var peak_frame_ms=0.0

func read_json(p):
	return JSON.parse_string(FileAccess.get_file_as_string("res://"+p))

func project(lon,lat):
	var phi=deg_to_rad(lat)
	var phi0=deg_to_rad(ORIGIN.y)
	var dl=deg_to_rad(lon-ORIGIN.x)
	var c=acos(clamp(sin(phi0)*sin(phi)+cos(phi0)*cos(phi)*cos(dl),-1.0,1.0))
	var k=1.0 if c<1e-10 else c/sin(c)
	return Vector3(RADIUS*k*cos(phi)*sin(dl),0,-RADIUS*k*(cos(phi0)*sin(phi)-sin(phi0)*cos(phi)*cos(dl)))

func unproject(p):
	var east=p.x
	var north=-p.z
	var rho=sqrt(east*east+north*north)
	if rho<1e-8:return ORIGIN
	var c=rho/RADIUS
	var phi0=deg_to_rad(ORIGIN.y)
	var lat=asin(cos(c)*sin(phi0)+north*sin(c)*cos(phi0)/rho)
	var lon=deg_to_rad(ORIGIN.x)+atan2(east*sin(c),rho*cos(phi0)*cos(c)-north*sin(phi0)*sin(c))
	return Vector2(rad_to_deg(lon),rad_to_deg(lat))

func _ready():
	manifest=read_json("data/world.json")
	sites=read_json("data/sites.json")
	research=read_json("data/research-locations.json").records
	hydrology=read_json("data/hydrology.json")
	for d in manifest.tiles:tiles[d.id]=d
	global_manifest=read_json("data/global/manifest.json")
	for d in global_manifest.tiles:tiles[d.id]=d
	if FileAccess.file_exists("res://data/native/manifest.json"):mesh_cache=read_json("data/native/manifest.json").entries
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--capture="):capture_name=arg.trim_prefix("--capture=")
		if arg.begins_with("--output="):capture_dir=arg.trim_prefix("--output=")
		if arg.begins_with("--view="):initial_view=arg.trim_prefix("--view=")
	if OS.get_cmdline_user_args().has("--match-baseline"):
		var baseline_folder="evidence/regional-before"
		for arg in OS.get_cmdline_user_args():
			if arg.begins_with("--baseline-folder="):baseline_folder=arg.trim_prefix("--baseline-folder=")
		var baseline=baseline_folder+"/godot-"+capture_name+".json"
		if FileAccess.file_exists("res://"+baseline):comparison_camera=read_json(baseline).camera
	configure_environment()
	make_material()
	context_node=load_tile("context")
	make_regional_backdrop()
	scenery=preload("res://regional_scenery.gd").new(self)
	make_water()
	make_markers()
	make_ui()
	make_rivers()
	make_lakes()
	if capture_name!="":jump(capture_name)
	else:jump(initial_view)
	startup_ms=Time.get_ticks_msec()-started
	print("GEOGRAPHY_READY sites=",sites.size()," research=",research.size()," Catana=15.088142,37.502959 startup_ms=",startup_ms)
	if OS.get_cmdline_user_args().has("--validate"):
		validate_geography()
		get_tree().quit()
	elif OS.get_cmdline_user_args().has("--exercise"):
		Engine.max_fps=120
		exercise_navigation()

func configure_environment():
	var environment=Environment.new()
	scene_environment=environment
	environment.background_mode=Environment.BG_SKY
	var sky=Sky.new()
	var sky_mat=ProceduralSkyMaterial.new()
	sky_mat.sky_top_color=Color("526e83")
	sky_mat.sky_horizon_color=Color("b4c1bf")
	sky_mat.ground_horizon_color=Color("b4c1bf")
	sky_mat.ground_bottom_color=Color("344c50")
	sky.sky_material=sky_mat
	environment.sky=sky
	environment.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color=Color("b9cfdf")
	environment.ambient_light_energy=.24
	environment.tonemap_mode=Environment.TONE_MAPPER_FILMIC
	environment.tonemap_exposure=1.0
	environment.fog_enabled=true
	environment.fog_light_color=Color("adbdc0")
	environment.fog_light_energy=.7
	environment.fog_density=.00012
	environment.ssao_enabled=true
	environment.ssao_radius=.008
	environment.ssao_intensity=.9
	var world_environment=WorldEnvironment.new()
	world_environment.environment=environment
	add_child(world_environment)
	sun=DirectionalLight3D.new()
	sun.light_color=Color("fff0d3")
	sun.light_energy=1.55
	sun.light_specular=.22
	sun.rotation_degrees=Vector3(-28,-58,0)
	sun.shadow_enabled=true
	sun.directional_shadow_max_distance=360.0
	sun.shadow_bias=.035
	sun.shadow_normal_bias=.8
	add_child(sun)
	camera=Camera3D.new()
	camera.fov=42
	camera.near=.01
	camera.far=40000
	add_child(camera)
	camera.current=true
	vegetation_root=Node3D.new()
	vegetation_root.name="InterpretiveVegetation"
	add_child(vegetation_root)
	city_root=Node3D.new()
	city_root.name="CatanaInterpretiveEnvironment"
	add_child(city_root)

func make_material():
	regional_manifest=read_json("data/regional/manifest.json")
	for item in ["land","ocean","shore","ecology"]:
		var image=Image.load_from_file("res://data/regional/"+item+".png")
		if item!="ecology":image.convert(Image.FORMAT_R8)
		if item=="land":regional_land=image
		regional_textures[item]=ImageTexture.create_from_image(image)
	base_material=ShaderMaterial.new()
	base_material.shader=load("res://terrain.gdshader")
	base_material.set_shader_parameter("macro_color",load("res://data/surface.png"))
	base_material.set_shader_parameter("regional_land",regional_textures.land)
	base_material.set_shader_parameter("ecology",regional_textures.ecology)
	for item in ["land","ocean","shore","ecology"]:
		var image=Image.load_from_file("res://data/global/"+item+".png")
		if item!="ecology":image.convert(Image.FORMAT_R8)
		if item=="land":global_land=image
		if item=="ecology":global_ecology=image
		global_textures[item]=ImageTexture.create_from_image(image)
	base_material.set_shader_parameter("global_land",global_textures.land)
	base_material.set_shader_parameter("global_ecology",global_textures.ecology)
	for item in [["quality_rock","limestone"],["quality_ground","meadow"],["quality_canopy","leaves"]]:
		var image=Image.load_from_file("res://assets/quality/"+item[1]+".png")
		image.generate_mipmaps()
		base_material.set_shader_parameter(item[0],ImageTexture.create_from_image(image))
	if OS.get_cmdline_user_args().has("--diagnostic"):base_material.set_shader_parameter("debug_view",1)
	if OS.get_cmdline_user_args().has("--river-diagnostic"):base_material.set_shader_parameter("debug_view",2)
	for name in ["rock","grass","soil","lava","sand"]:
		base_material.set_shader_parameter(name,load("res://materials/"+name+".png"))
	for name in ["rock","grass","lava"]:
		base_material.set_shader_parameter(name+"_normal",load("res://materials/"+name+"-normal.png"))

func mesh_fingerprint(p,parent_path=""):
	var paths=["res://"+p]
	if parent_path!="":paths.append_array([parent_path,parent_path.replace(".parent",".normal"),parent_path.replace(".parent",".pnormal")])
	var parts=["mesh-reader-1"]
	for file in paths:parts.append(FileAccess.get_sha256(file) if FileAccess.file_exists(file) else "missing")
	return "|".join(parts).sha256_text()

func mesh_from_file(p,parent_path=""):
	if not mesh_cache_building and mesh_cache.has(p):
		var entry=mesh_cache[p]
		if FileAccess.file_exists(entry.path) and entry.hash==mesh_fingerprint(p,parent_path):return ResourceLoader.load(entry.path,"ArrayMesh",ResourceLoader.CACHE_MODE_IGNORE)
	var f=FileAccess.open("res://"+p,FileAccess.READ)
	var count=f.get_32()
	var indices=f.get_32()
	var arrays=[]
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX]=f.get_buffer(count*12).to_float32_array().to_byte_array().to_vector3_array()
	arrays[Mesh.ARRAY_NORMAL]=f.get_buffer(count*12).to_float32_array().to_byte_array().to_vector3_array()
	var tangents=PackedFloat32Array()
	tangents.resize(count*4)
	for i in count:
		var n=arrays[Mesh.ARRAY_NORMAL][i]
		var t=Vector3(n.y,-n.x,0).normalized()
		tangents[i*4]=t.x
		tangents[i*4+1]=t.y
		tangents[i*4+2]=t.z
		tangents[i*4+3]=1.0
	arrays[Mesh.ARRAY_TANGENT]=tangents
	arrays[Mesh.ARRAY_TEX_UV]=f.get_buffer(count*8).to_vector2_array()
	arrays[Mesh.ARRAY_TEX_UV2]=f.get_buffer(count*8).to_vector2_array()
	var color_data=f.get_buffer(count*16).to_float32_array()
	var normals_path=parent_path.replace(".parent",".normal")
	var parent_normals_path=parent_path.replace(".parent",".pnormal")
	var parent_normals=PackedFloat32Array()
	if parent_path!="" and FileAccess.file_exists(normals_path):
		arrays[Mesh.ARRAY_NORMAL]=FileAccess.get_file_as_bytes(normals_path).to_vector3_array()
		parent_normals=FileAccess.get_file_as_bytes(parent_normals_path).to_float32_array()
	var colors=PackedColorArray()
	colors.resize(count)
	for i in count:
		var normal=Vector3(parent_normals[i*3],parent_normals[i*3+1],parent_normals[i*3+2]) if parent_normals.size()==count*3 else arrays[Mesh.ARRAY_NORMAL][i]
		colors[i]=Color(normal.x*.5+.5,normal.y*.5+.5,normal.z*.5+.5,1)
	arrays[Mesh.ARRAY_COLOR]=colors
	var parent_values=FileAccess.get_file_as_bytes(parent_path).to_float32_array() if parent_path!="" else PackedFloat32Array()
	var height_uv=PackedVector2Array()
	height_uv.resize(count)
	for i in count:height_uv[i]=Vector2(parent_values[i] if parent_values.size()==count else color_data[i*4],0)
	arrays[Mesh.ARRAY_TEX_UV2]=height_uv
	arrays[Mesh.ARRAY_INDEX]=f.get_buffer(indices*4).to_int32_array()
	var mesh=ArrayMesh.new()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays)
	return mesh

func load_tile(id):
	var begin=Time.get_ticks_usec()
	var d=tiles[id]
	var node=MeshInstance3D.new()
	node.name=id
	node.mesh=mesh_from_file(d.mesh,"res://data/regional/"+id+".parent" if d.kind=="regional" else "")
	var mat=base_material.duplicate()
	var coast_texture=regional_textures.land if d.kind=="regional" else global_textures.land
	mat.set_shader_parameter("coast",coast_texture)
	mat.set_shader_parameter("tile_bounds",Vector4(d.bounds.west,d.bounds.south,d.bounds.east,d.bounds.north))
	mat.set_shader_parameter("detail_strength",.32 if d.kind=="context" else 1.0)
	node.material_override=mat
	node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_ON if d.kind=="regional" else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(node)
	var heights=FileAccess.get_file_as_bytes("res://"+d.heights).to_float32_array()
	resident[id]={"node":node,"heights":heights,"descriptor":d,"mask":regional_land if d.kind=="regional" else global_land,"born":Time.get_ticks_msec(),"reveal":1.0 if id=="context" else 0.0}
	loading_ms.append((Time.get_ticks_usec()-begin)/1000.0)
	return node

func make_regional_backdrop():
	regional_heights=FileAccess.get_file_as_bytes("res://"+regional_manifest.heights).to_float32_array()
	regional_node=MeshInstance3D.new()
	regional_node.name="ItaliaSicilyContinuousTerrain"
	regional_node.mesh=mesh_from_file(regional_manifest.mesh)
	var mat=base_material.duplicate()
	mat.set_shader_parameter("tile_bounds",Vector4(6,35,20,49))
	mat.set_shader_parameter("neighbors",Vector4.ZERO)
	mat.set_shader_parameter("coast",regional_textures.land)
	regional_node.material_override=mat
	add_child(regional_node)

func regional_height(lon,lat):
	var n=int(regional_manifest.grid)
	var w=n+1
	var x=clamp((lon-6)*32,0.0,float(n)-.0001)
	var y=clamp((49-lat)*32,0.0,float(n)-.0001)
	var ix=int(x);var iy=int(y);var fx=x-ix;var fy=y-iy
	var a=regional_heights[iy*w+ix];var b=regional_heights[iy*w+ix+1]
	var c=regional_heights[(iy+1)*w+ix];var d=regional_heights[(iy+1)*w+ix+1]
	return a+(b-a)*fx+(c-a)*fy if fx+fy<1 else d+(c-d)*(1-fx)+(b-d)*(1-fy)

func contains(b,lon,lat):return lon>=b.west and lon<=b.east and lat>=b.south and lat<=b.north

func sample_entry(e,lon,lat):
	var d=e.descriptor
	var g=int(d.grid)
	var x=clamp((lon-d.bounds.west)/(d.bounds.east-d.bounds.west)*g,0.0,float(g)-.00001)
	var y=clamp((d.bounds.north-lat)/(d.bounds.north-d.bounds.south)*g,0.0,float(g)-.00001)
	var ix=int(x);var iy=int(y);var fx=x-ix;var fy=y-iy
	var a=mesh_vertex_height(e,ix,iy);var b=mesh_vertex_height(e,ix+1,iy)
	var c=mesh_vertex_height(e,ix,iy+1);var v=mesh_vertex_height(e,ix+1,iy+1)
	return a+(b-a)*fx+(c-a)*fy if fx+fy<1 else v+(c-v)*(1-fx)+(b-v)*(1-fy)

func mesh_vertex_height(e,gx,gy):
	var d=e.descriptor
	var b=d.bounds
	var x=float(gx)/d.grid*(d.width-1)
	var y=float(gy)/d.grid*(d.height-1)
	var ix=int(x)
	var iy=int(y)
	var jx=mini(ix+1,d.width-1)
	var jy=mini(iy+1,d.height-1)
	var values=e.heights
	var h=max(.001,lerp(lerp(values[iy*d.width+ix],values[iy*d.width+jx],x-ix),lerp(values[jy*d.width+ix],values[jy*d.width+jx],x-ix),y-iy)*.0015)
	if d.kind!="context":
		var u=float(gx)/d.grid;var v=float(gy)/d.grid
		var nx=e.get("neighbors",Vector4.ONE)
		var blend=1.0
		if nx.x<.5:blend=min(blend,u/.055)
		if nx.y<.5:blend=min(blend,(1-u)/.055)
		if nx.z<.5:blend=min(blend,v/.055)
		if nx.w<.5:blend=min(blend,(1-v)/.055)
		if clamp(blend,0.0,1.0)*e.reveal>=1.0:return h
		var lon=lerp(b.west,b.east,u);var lat=lerp(b.north,b.south,v)
		var parent=regional_height(lon,lat) if d.kind=="regional" else sample_entry(resident.context,lon,lat)
		h=lerp(parent,h,clamp(blend,0.0,1.0)*e.reveal)
	return h

func elevation(lon,lat):
	var best=resident.context
	var area=100000.0
	for id in resident:
		var e=resident[id]
		var b=e.descriptor.bounds
		var size=(b.east-b.west)*(b.north-b.south)
		if contains(b,lon,lat) and size<area:best=e;area=size
	var in_region=regional_active and contains(regional_manifest.bounds,lon,lat)
	if in_region and best.descriptor.kind!="regional":return regional_height(lon,lat)
	return max(.001,sample_entry(best,lon,lat))

func is_land(lon,lat):
	if contains(regional_manifest.bounds,lon,lat):
		var x=clampi(roundi((lon-6)*512),0,7168)
		var y=clampi(roundi((49-lat)*512),0,7168)
		return regional_land.get_pixel(x,y).r>.5
	var x=clampi(roundi((lon+12)*128),0,11136)
	var y=clampi(roundi((62-lat)*128),0,6400)
	return global_land.get_pixel(x,y).r>.5

func make_water():
	water_material=ShaderMaterial.new()
	water_material.shader=load("res://water.gdshader")
	water_material.render_priority=-128
	water_material.set_shader_parameter("shore_mask",load("res://data/ocean-exclusion.png"))
	water_material.set_shader_parameter("regional_ocean",regional_textures.ocean)
	water_material.set_shader_parameter("regional_shore",regional_textures.shore)
	water_material.set_shader_parameter("regional_land",regional_textures.land)
	water_material.set_shader_parameter("global_land",global_textures.land)
	water_material.set_shader_parameter("global_ocean",global_textures.ocean)
	water_material.set_shader_parameter("global_shore",global_textures.shore)
	var water=MeshInstance3D.new()
	var plane=PlaneMesh.new()
	plane.size=Vector2(40000,40000)
	water.mesh=plane
	water.position.y=0.0
	water.material_override=water_material
	water.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(water)

func make_markers():
	marker_root=Node3D.new()
	add_child(marker_root)
	for s in sites:
		var label=Label3D.new()
		label.text=s.name
		label.font_size=44
		label.outline_size=10
		label.modulate=Color("f3dfab")
		label.outline_modulate=Color("16252b")
		label.billboard=BaseMaterial3D.BILLBOARD_ENABLED
		label.no_depth_test=true
		marker_root.add_child(label)
		markers.append({"site":s,"label":label})

func make_ui():
	var canvas=CanvasLayer.new()
	add_child(canvas)
	var root=Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter=Control.MOUSE_FILTER_IGNORE
	canvas.add_child(root)
	ui_panel=PanelContainer.new()
	ui_panel.position=Vector2(28,28)
	ui_panel.size=Vector2(286,420)
	var style=StyleBoxFlat.new()
	style.bg_color=Color(.035,.067,.077,.91)
	style.border_color=Color("85734b")
	style.set_border_width_all(1)
	style.content_margin_left=20
	style.content_margin_right=20
	style.content_margin_top=18
	style.content_margin_bottom=18
	ui_panel.add_theme_stylebox_override("panel",style)
	root.add_child(ui_panel)
	var box=VBoxContainer.new()
	box.add_theme_constant_override("separation",10)
	ui_panel.add_child(box)
	var brand=Label.new()
	brand.text="HISTORICAL PARADOX DEI"
	brand.add_theme_color_override("font_color",Color("d1b979"))
	brand.add_theme_font_size_override("font_size",13)
	box.add_child(brand)
	var heading=Label.new()
	heading.text="Campaign World"
	heading.add_theme_font_size_override("font_size",28)
	box.add_child(heading)
	var sub=Label.new()
	sub.text="278 BCE  /  Geographic prototype"
	sub.add_theme_color_override("font_color",Color("acbdbb"))
	box.add_child(sub)
	for item in [["Campaign overview","overview"],["Alps & northern Italy","alps"],["Po Valley","po"],["Central Apennines","apennines"],["Southern Italy","south"],["Sicily & southern Italy","sicily"],["Catana · Mount Etna","etna"],["Catana settlement","catana"]]:
		var button=Button.new()
		button.text=item[0]
		button.pressed.connect(jump.bind(item[1]))
		box.add_child(button)
	search=LineEdit.new()
	var region_picker=OptionButton.new()
	region_picker.add_item("Explore campaign regions…")
	var region_keys=read_json("data/global-views.json").keys()
	for key in region_keys:region_picker.add_item(str(key).capitalize())
	region_picker.item_selected.connect(func(index):
		if index>0:jump(region_keys[index-1]))
	box.add_child(region_picker)
	search.placeholder_text="Find an approved settlement…"
	search.text_changed.connect(filter_sites)
	box.add_child(search)
	site_list=ItemList.new()
	site_list.custom_minimum_size=Vector2(240,135)
	site_list.item_selected.connect(select_list)
	box.add_child(site_list)
	filter_sites("")
	var check=CheckButton.new()
	check.text="Research references (687 retained)"
	check.toggled.connect(toggle_research)
	box.add_child(check)
	selection_label=Label.new()
	selection_label.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	selection_label.custom_minimum_size.x=240
	selection_label.text="35 approved sites · original coordinates"
	box.add_child(selection_label)
	var caveat=Label.new()
	caveat.text="Modern terrain foundation. Vegetation and\nsettlement forms are interpretive scenery."
	caveat.add_theme_font_size_override("font_size",12)
	caveat.add_theme_color_override("font_color",Color("98aaa8"))
	box.add_child(caveat)
	status=Label.new()
	status.position=Vector2(28,1010)
	status.add_theme_font_size_override("font_size",15)
	root.add_child(status)
	var help=Label.new()
	help.text="WASD / arrows: pan     Q E: rotate     wheel: zoom     right drag: orbit     middle drag: pan     Home: overview"
	help.position=Vector2(365,30)
	help.add_theme_color_override("font_color",Color("e0d4b7"))
	root.add_child(help)

func filter_sites(query):
	site_list.clear()
	for s in sites:
		if query.is_empty() or query.to_lower() in s.name.to_lower():
			site_list.add_item(s.name)
			site_list.set_item_metadata(site_list.item_count-1,s.key)

func select_list(index):select_site(site_list.get_item_metadata(index))

func select_site(key):
	if capture_name!="":return
	for s in sites:
		if s.key==key:
			selected=key
			goal_focus=Vector2(s.lon,s.lat)
			goal_distance=12.0 if key=="catana" else 70.0
			selection_label.text="%s\n%.6f° E · %.6f° N\n%s" % [s.name,s.lon,s.lat,s.id]
			return

func jump(name):
	if capture_name!="" and name!=capture_name:return
	var views={"overview":[29.0,37.0,8500.0,78.0,0.0],"sicily":[14.5,37.7,520.0,57.0,0.0],"etna":[15.11,37.70,22.0,8.0,90.0],"catana":[15.088142,37.502959,1.8,36.0,-22.0],"alps":[11.1,45.85,100.0,28.0,0.0],"po":[10.5,45.12,95.0,38.0,-20.0],"apennines":[13.58,42.43,85.0,30.0,28.0],"south":[16.15,39.25,105.0,34.0,20.0]}
	var view=views.get(name,views.overview)
	var global_views=read_json("data/global-views.json")
	if global_views.has(name):view=global_views[name]
	goal_focus=Vector2(view[0],view[1])
	goal_distance=view[2]
	pitch=view[3]
	yaw=view[4]
	if ready_frame==0 or capture_name!="":focus=goal_focus;distance=goal_distance
	queue_tiles()

func queue_tiles():
	var family="regional" if distance<1800 and focus.x>=6 and focus.x<=20 and focus.y>=35 and focus.y<=49 else "world"
	if distance>6000:family="context"
	var candidates=[]
	for id in tiles:
		var d=tiles[id]
		if d.kind!=family:continue
		var b=d.bounds
		var center=Vector2((b.west+b.east)*.5,(b.south+b.north)*.5)
		candidates.append({"id":id,"score":center.distance_squared_to(focus)})
	candidates.sort_custom(func(a,b):return a.score<b.score)
	var next=[]
	for item in candidates.slice(0,12):next.append(item.id)
	if next==desired:return
	desired=next
	queue=[]
	for id in desired:
		if not resident.has(id):queue.append(id)
	for id in resident.keys():
		if id!="context" and not desired.has(id):
			resident[id].node.queue_free()
			resident.erase(id)
	last_family=family
	update_coverage()

func update_coverage():
	var rectangles=PackedVector4Array()
	for id in resident:
		if id=="context":continue
		var b=tiles[id].bounds
		rectangles.append(Vector4((b.west+12)/87,(62-b.north)/50,(b.east+12)/87,(62-b.south)/50))
	var count=rectangles.size()
	while rectangles.size()<12:rectangles.append(Vector4.ZERO)
	context_node.material_override.set_shader_parameter("children",rectangles)
	context_node.material_override.set_shader_parameter("child_count",count)
	var regional_rectangles=PackedVector4Array()
	for id in resident:
		if resident[id].descriptor.kind=="regional":
			var b=tiles[id].bounds
			regional_rectangles.append(Vector4((b.west+12)/87,(62-b.north)/50,(b.east+12)/87,(62-b.south)/50))
	var regional_count=regional_rectangles.size()
	while regional_rectangles.size()<12:regional_rectangles.append(Vector4.ZERO)
	if regional_node!=null:
		regional_node.material_override.set_shader_parameter("children",regional_rectangles)
		regional_node.material_override.set_shader_parameter("child_count",regional_count)
	for id in resident:
		if id=="context":continue
		var b=tiles[id].bounds
		var nx=Vector4.ZERO
		for other in resident:
			if other==id or other=="context":continue
			var c=tiles[other].bounds
			if abs(c.east-b.west)<.0001 and c.south==b.south:nx.x=1
			if abs(c.west-b.east)<.0001 and c.south==b.south:nx.y=1
			if abs(c.south-b.north)<.0001 and c.west==b.west:nx.z=1
			if abs(c.north-b.south)<.0001 and c.west==b.west:nx.w=1
		resident[id]["neighbors"]=nx
		resident[id].node.material_override.set_shader_parameter("neighbors",nx)

func _process(delta):
	var now_usec=Time.get_ticks_usec()
	var wall_ms=(now_usec-last_frame_usec)/1000.0 if last_frame_usec>0 else delta*1000.0
	last_frame_usec=now_usec
	peak_frame_ms=max(peak_frame_ms,wall_ms)
	all_frame_times.append(wall_ms)
	if all_frame_times.size()>900:all_frame_times.pop_front()
	ready_frame+=1
	var dt=min(delta,.05)
	focus=focus.lerp(goal_focus,1.0-exp(-dt*9))
	distance=lerp(distance,goal_distance,1.0-exp(-dt*9))
	if capture_name!="":distance=goal_distance
	if not search.has_focus() and capture_name=="":
		var move=Vector2(float(Input.is_physical_key_pressed(KEY_D) or Input.is_physical_key_pressed(KEY_RIGHT))-float(Input.is_physical_key_pressed(KEY_A) or Input.is_physical_key_pressed(KEY_LEFT)),float(Input.is_physical_key_pressed(KEY_W) or Input.is_physical_key_pressed(KEY_UP))-float(Input.is_physical_key_pressed(KEY_S) or Input.is_physical_key_pressed(KEY_DOWN)))
		if move.length()>0:
			var p=project(goal_focus.x,goal_focus.y)
			var speed=max(.1,distance*.35)*dt
			p+=Vector3(move.x,0,-move.y).rotated(Vector3.UP,deg_to_rad(yaw))*speed
			goal_focus=unproject(p)
		if Input.is_physical_key_pressed(KEY_Q):yaw+=dt*40
		if Input.is_physical_key_pressed(KEY_E):yaw-=dt*40
	goal_focus.x=clamp(goal_focus.x,-12.0,75.0)
	goal_focus.y=clamp(goal_focus.y,12.0,62.0)
	target=project(focus.x,focus.y)
	target.y=elevation(focus.x,focus.y)
	var offset=Vector3(0,sin(deg_to_rad(pitch)),cos(deg_to_rad(pitch))).rotated(Vector3.UP,deg_to_rad(yaw))*distance
	camera.position=target+offset
	# Kilometre units require a useful near plane on a 24-bit compatibility depth buffer.
	# A metre-scale near plane at regional zoom quantizes coastal ground into the sea.
	camera.near=max(.003,distance*.025)
	camera.far=max(500.0,distance*5+200)
	camera.look_at(target)
	if not comparison_camera.is_empty():
		var p=comparison_camera.position
		camera.position=Vector3(p[0],p[1],p[2])
		var direction=Vector3(0,sin(deg_to_rad(comparison_camera.pitch)),cos(deg_to_rad(comparison_camera.pitch))).rotated(Vector3.UP,deg_to_rad(comparison_camera.yaw))
		camera.look_at(camera.position-direction*comparison_camera.distance)
	water_material.set_shader_parameter("camera_distance",distance)
	sun.directional_shadow_max_distance=clamp(distance*1.6,3.0,360.0)
	regional_active=distance<3300
	regional_node.visible=regional_active
	regional_node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_ON if distance>8 else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	strategic_regional_rivers.visible=not regional_active
	strategic_world_rivers.visible=distance>=500
	var material_detail=1.0-smoothstep(250.0,1800.0,distance)
	context_node.material_override.set_shader_parameter("detail_strength",material_detail)
	context_node.material_override.set_shader_parameter("camera_distance",distance)
	regional_node.material_override.set_shader_parameter("detail_strength",material_detail)
	regional_node.material_override.set_shader_parameter("camera_distance",distance)
	for id in resident:
		resident[id].node.material_override.set_shader_parameter("clip_region",regional_active and resident[id].descriptor.kind!="regional")
		resident[id].node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_ON if resident[id].descriptor.kind=="regional" and distance>8 else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	scene_environment.fog_density=.00065*clamp(150.0/distance,.015,1.0)
	vegetation_root.visible=distance<190
	scene_environment.ssao_enabled=distance<18
	city_root.visible=distance<20
	tick+=dt
	if tick>.4:
		tick=0
		queue_tiles()
	if queue.size()>0:
		load_tile(queue.pop_front())
		update_coverage()
	for id in resident:
		if id=="context":continue
		resident[id].reveal=clamp((Time.get_ticks_msec()-resident[id].born)/650.0,0.0,1.0)
		resident[id].node.material_override.set_shader_parameter("reveal",resident[id].reveal)
		resident[id].node.material_override.set_shader_parameter("detail_strength",material_detail)
		resident[id].node.material_override.set_shader_parameter("camera_distance",distance)
	if queue.is_empty() and city_root.get_child_count()==0 and resident.has("N37E15") and resident.N37E15.reveal>=1.0:
		build_catana()
	if queue.is_empty() and distance<1800 and regional_active:
		var signature=str(resident.keys())+str(Vector2i(floori(focus.x),floori(focus.y)))
		var stable=true
		for id in resident:
			if resident[id].reveal<1:stable=false
		if signature!=river_signature and stable:
			river_signature=signature
			make_regional_rivers()
	if regional_river!=null:regional_river.visible=distance<500
	scenery.tick()
	var settled=queue.is_empty() and not scenery.busy
	for id in resident:
		if resident[id].reveal<1:settled=false
	if settled:settled_frame_times.append(wall_ms)
	else:settled_frame_times.clear()
	if settled_frame_times.size()>300:settled_frame_times.pop_front()
	update_markers()
	if ready_frame>90:frame_times.append(wall_ms)
	if frame_times.size()>900:frame_times.pop_front()
	status.text="%d FPS   ·   %.1f km camera   ·   %d terrain tiles   ·   WASD geographic navigation" % [Engine.get_frames_per_second(),distance,resident.size()]
	if capture_name!="" and ready_frame>600 and settled_frame_times.size()>=180 and not capture_done:
		capture_done=true
		capture()

func update_markers():
	var occupied=[]
	for m in markers:
		var s=m.site
		m.label.position=Vector3(s.x,elevation(s.lon,s.lat)+max(.015,distance*.002),s.z)
		m.label.pixel_size=max(.0003,distance*.00025)
		m.label.visible=distance>8 or m.label.position.distance_to(target)<distance*1.2
		if camera.is_position_behind(m.label.position):m.label.visible=false
		var screen=camera.unproject_position(m.label.position)
		var rect=Rect2(screen-Vector2(38,10),Vector2(90,25))
		if screen.x<390 or screen.x>1900 or screen.y<60 or screen.y>1030:m.label.visible=false
		for r in occupied:
			if rect.intersects(r):m.label.visible=false
		if m.label.visible:occupied.append(rect)
		m.label.modulate=Color("ffdc80") if s.key==selected else Color("f0e4c3")

func _unhandled_input(event):
	if capture_name!="":return
	if event is InputEventKey and event.pressed and event.keycode==KEY_HOME:jump("overview")
	if event is InputEventMouseButton and event.pressed:
		if event.button_index==MOUSE_BUTTON_WHEEL_UP:zoom_at(event.position,.85)
		if event.button_index==MOUSE_BUTTON_WHEEL_DOWN:zoom_at(event.position,1.0/.85)
		if event.button_index==MOUSE_BUTTON_LEFT:
			var best=""
			var near=26.0
			for m in markers:
				if camera.is_position_behind(m.label.position):continue
				var d=camera.unproject_position(m.label.position).distance_to(event.position)
				if d<near:best=m.site.key;near=d
			if best!="":select_site(best)
	if event is InputEventMouseMotion:
		if Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT):yaw-=event.relative.x*.22;pitch=clamp(pitch+event.relative.y*.18,8.0,89.0)
		if Input.is_mouse_button_pressed(MOUSE_BUTTON_MIDDLE):
			var p=project(goal_focus.x,goal_focus.y)
			p+=Vector3(-event.relative.x,0,-event.relative.y).rotated(Vector3.UP,deg_to_rad(yaw))*distance*.0007
			goal_focus=unproject(p)

func zoom_at(screen,ratio):
	var next=clamp(goal_distance*ratio,1.2,30000.0)
	var ray=camera.project_ray_normal(screen)
	if ray.y<-.01:
		var origin=camera.project_ray_origin(screen)
		var hit=origin+ray*((target.y-origin.y)/ray.y)
		var center=project(goal_focus.x,goal_focus.y)
		goal_focus=unproject(center+(hit-target)*(1.0-next/goal_distance))
	goal_distance=next

func make_rivers():
	for regional in [false,true]:
		var mesh=ImmediateMesh.new()
		var mat=StandardMaterial3D.new()
		mat.albedo_color=Color("477f87")
		mat.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED
		mesh.surface_begin(Mesh.PRIMITIVE_LINES,mat)
		for f in hydrology.rivers:
			var lines=f.geometry.coordinates if f.geometry.type=="MultiLineString" else [f.geometry.coordinates]
			for line in lines:
				for i in range(1,line.size()):
					var p0=line[i-1]
					if contains(regional_manifest.bounds,p0[0],p0[1])!=regional:continue
					for p in [line[i-1],line[i]]:
						var v=project(p[0],p[1]);v.y=elevation(p[0],p[1])+.025
						mesh.surface_add_vertex(v)
		mesh.surface_end()
		var node=MeshInstance3D.new()
		node.mesh=mesh
		node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(node)
		if regional:strategic_regional_rivers=node
		else:strategic_world_rivers=node

func make_lakes():
	var lakes=read_json("data/lakes.json")
	var regional_levels=read_json("data/regional/lake-levels.json")
	var mesh=ImmediateMesh.new()
	var mat=material("244b55",.38)
	mat.cull_mode=BaseMaterial3D.CULL_DISABLED
	mesh.surface_begin(Mesh.PRIMITIVE_TRIANGLES,mat)
	for lake in lakes:
		for index in lake.indices:
			var p=lake.vertices[index]
			mesh.surface_set_normal(Vector3.UP)
			mesh.surface_add_vertex(Vector3(p[0],regional_levels.get(str(lake.id),p[1]),p[2]))
	mesh.surface_end()
	var node=MeshInstance3D.new()
	node.mesh=mesh
	node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(node)

func make_regional_rivers():
	# Original ribbons follow existing centreline data. Width is a visual convention,
	# not a historical bank survey. Resample against the active terrain surface.
	if regional_river!=null:regional_river.queue_free()
	var mesh=ImmediateMesh.new()
	var mat=material("355b60",.32)
	mat.cull_mode=BaseMaterial3D.CULL_DISABLED
	var points=[]
	for f in hydrology.rivers:
		var lines=f.geometry.coordinates if f.geometry.type=="MultiLineString" else [f.geometry.coordinates]
		for line in lines:
			for i in range(1,line.size()):
				var a=Vector2(line[i-1][0],line[i-1][1])
				var b=Vector2(line[i][0],line[i][1])
				var italian=contains(regional_manifest.bounds,a.x,a.y)
				var projected=project(a.x,a.y)
				if projected.distance_to(target)>max(80.0,distance*1.5):continue
				var steps=max(1,int(projected.distance_to(project(b.x,b.y))/(.25 if italian else 1.0)))
				for j in steps:
					var ga=a.lerp(b,float(j)/steps)
					var gb=a.lerp(b,float(j+1)/steps)
					if not is_land(ga.x,ga.y):continue
					var pa=project(ga.x,ga.y);pa.y=elevation(ga.x,ga.y)+.003
					var pb=project(gb.x,gb.y);pb.y=elevation(gb.x,gb.y)+.003
					var side=(pb-pa).cross(Vector3.UP).normalized()*(.0225 if italian else .075)
					points.append_array([pa-side,pa+side,pb-side,pa+side,pb+side,pb-side])
	if points.is_empty():return
	mesh.surface_begin(Mesh.PRIMITIVE_TRIANGLES,mat)
	for p in points:
		mesh.surface_set_normal(Vector3.UP)
		mesh.surface_add_vertex(p)
	mesh.surface_end()
	regional_river=MeshInstance3D.new()
	regional_river.mesh=mesh
	regional_river.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(regional_river)

func exercise_navigation():
	validate_geography()
	var checks=[]
	for view in ["overview","sicily","etna","catana"]:
		jump(view)
		await get_tree().create_timer(2.0).timeout
		assert(queue.is_empty())
		assert(resident.size()<=13)
		for m in markers:
			assert(abs(m.label.position.x-m.site.x)<.001)
			assert(abs(m.label.position.z-m.site.z)<.001)
		checks.append({"view":view,"residentTiles":resident.size(),"stableHorizontalAnchors":35})
	for geo in [Vector2(24,38),Vector2(30,27)]:
		goal_focus=geo;focus=geo;goal_distance=800.0;distance=800.0
		queue_tiles()
		await get_tree().create_timer(1.2).timeout
		assert(queue.is_empty() and resident.size()<=13)
	select_site("catana")
	assert(selected=="catana")
	assert(goal_focus.distance_to(Vector2(15.088142,37.502959))<.00001)
	var file=FileAccess.open("res://evidence/navigation-validation.json",FileAccess.WRITE)
	file.store_string(JSON.stringify({"checks":checks,"worldTransitions":["Greece","Egypt"],"settlementSelection":"catana","maxResidentTiles":13,"passed":true},"  "))
	print("NAVIGATION_OK overview, Sicily, Etna, Catana, Greece, Egypt; stable approved anchors")
	get_tree().quit()

func toggle_research(enabled):
	research_enabled=enabled
	if research_root!=null:research_root.queue_free()
	research_root=Node3D.new()
	add_child(research_root)
	if not enabled:return
	for r in research:
		var c=r.get("coordinates",null)
		if c==null or c.get("lon")==null or c.get("lat")==null:continue
		if not contains(manifest.bounds,c.lon,c.lat):continue
		var label=Label3D.new()
		label.text="·"
		label.modulate=Color("9ec8ba")
		label.pixel_size=2.0
		label.billboard=BaseMaterial3D.BILLBOARD_ENABLED
		label.no_depth_test=true
		label.position=project(c.lon,c.lat)+Vector3(0,elevation(c.lon,c.lat)+.02,0)
		research_root.add_child(label)

func material(color,roughness=.9):
	var mat=StandardMaterial3D.new()
	mat.albedo_color=Color(color)
	mat.roughness=roughness
	return mat

func box_at(parent,pos,size,mat):
	var key=str(mat.get_instance_id())
	if not city_batches.has(key):city_batches[key]={"material":mat,"transforms":[]}
	city_batches[key].transforms.append(Transform3D(Basis.IDENTITY.scaled(size),pos))

func build_catana():
	var center=project(15.088142,37.502959)
	var stone=material("c6b791")
	var roof=material("91533a")
	roof.set_meta("roof",true)
	var road=material("b2a17e")
	var rng=RandomNumberGenerator.new()
	rng.seed=278
	for i in 480:
		var col=i%24
		var row=i/24
		var p=center+Vector3((col-11.5)*.035+rng.randf_range(-.004,.004),0,(row-9.5)*.035+rng.randf_range(-.004,.004))
		var delta=p-center
		if pow(delta.x/.44,2)+pow(delta.z/.36,2)>rng.randf_range(.82,1.12):continue
		if abs(delta.x)<.055 and abs(delta.z)<.045:continue
		var geo=unproject(p)
		if not is_land(geo.x,geo.y):continue
		p.y=elevation(geo.x,geo.y)
		var size=Vector3(rng.randf_range(.012,.027),rng.randf_range(.009,.018),rng.randf_range(.014,.03))
		box_at(city_root,p+Vector3(0,size.y*.5,0),size,stone)
		box_at(city_root,p+Vector3(0,size.y+.002,0),Vector3(size.x*1.13,.008,size.z*1.13),roof)
	var h=elevation(15.088142,37.502959)
	box_at(city_root,center+Vector3(0,h+.004,0),Vector3(.075,.008,.045),stone)
	box_at(city_root,center+Vector3(0,h+.033,0),Vector3(.066,.009,.037),roof)
	for x in 8:
		for z in [-1,1]:box_at(city_root,center+Vector3((x-3.5)*.008,h+.018,z*.016),Vector3(.0025,.024,.0025),stone)
	for j in [-1,0,1]:
		box_at(city_root,center+Vector3(j*.18,h+.001,0),Vector3(.008,.001, .65),road)
	for key in city_batches:
		var batch=city_batches[key]
		var mm=MultiMesh.new()
		mm.transform_format=MultiMesh.TRANSFORM_3D
		var mesh=PrismMesh.new() if batch.material.has_meta("roof") else BoxMesh.new()
		mesh.size=Vector3.ONE
		mesh.material=batch.material
		mm.mesh=mesh
		mm.instance_count=batch.transforms.size()
		for i in mm.instance_count:mm.set_instance_transform(i,batch.transforms[i])
		var node=MultiMeshInstance3D.new()
		node.multimesh=mm
		city_root.add_child(node)
	city_batches.clear()
	print("CATANA_SCENERY_READY buildings=",city_root.get_child_count()," interpretive=true")

func build_vegetation():
	var rng=RandomNumberGenerator.new()
	rng.seed=278101
	var mesh=SphereMesh.new()
	mesh.radius=.013
	mesh.height=.023
	mesh.radial_segments=6
	mesh.rings=3
	var mat=material("4b5e35")
	mat.vertex_color_use_as_albedo=true
	mesh.material=mat
	var batch={}
	var groves=[]
	for i in 85:groves.append(Vector2(rng.randf_range(14.78,15.22),rng.randf_range(37.45,37.99)))
	for i in 60000:
		if i%2000==0:await get_tree().process_frame
		var grove=groves[i%groves.size()]
		var lon=grove.x+rng.randfn(0,.009)
		var lat=grove.y+rng.randfn(0,.007)
		if not is_land(lon,lat):continue
		var h=elevation(lon,lat)
		if h<.1 or h>2.5:continue
		var patch=sin(lon*55+sin(lat*43))*cos(lat*81)
		if patch<-.1:continue
		var p=project(lon,lat)
		p.y=h+.014
		var key=Vector2i(floor(p.x/4),floor(p.z/4))
		if not batch.has(key):batch[key]=[]
		batch[key].append(p)
	for key in batch:
		var mm=MultiMesh.new()
		mm.transform_format=MultiMesh.TRANSFORM_3D
		mm.use_colors=true
		mm.mesh=mesh
		mm.instance_count=batch[key].size()
		for i in mm.instance_count:
			var scale=rng.randf_range(.65,1.6)
			mm.set_instance_transform(i,Transform3D(Basis.IDENTITY.scaled(Vector3(scale,scale,scale)),batch[key][i]))
			mm.set_instance_color(i,Color(.62+rng.randf()*.25,.75+rng.randf()*.2,.55+rng.randf()*.2))
		var node=MultiMeshInstance3D.new()
		node.multimesh=mm
		node.visibility_range_end=120
		node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		vegetation_root.add_child(node)
	print("VEGETATION_READY batches=",batch.size())

func validate_geography():
	assert(sites.size()==35)
	assert(research.size()==687)
	var worst=0.0
	for s in sites:
		var p=project(s.lon,s.lat)
		assert(p.distance_to(Vector3(s.x,0,s.z))<.001)
		var back=unproject(p)
		worst=max(worst,back.distance_to(Vector2(s.lon,s.lat)))
	assert(worst<1e-5)
	print("VALIDATION_OK 35 stable identities; 687 retained records; projection roundtrip degrees=",worst)

func capture():
	# Hidden desktop windows may stop emitting frame_post_draw. Explicitly render the
	# final frame instead of leaving the automated capture suspended indefinitely.
	RenderingServer.force_draw()
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(capture_dir))
	var path=capture_dir+"/godot-"+capture_name+".png"
	get_viewport().get_texture().get_image().save_png(path)
	var sorted=frame_times.duplicate()
	sorted.sort()
	var mean=0.0
	for v in sorted:mean+=v
	mean/=max(1,sorted.size())
	var metrics={"view":capture_name,"engine":Engine.get_version_info(),"renderer":RenderingServer.get_video_adapter_name(),"resolution":get_viewport().get_visible_rect().size,"camera":{"focus":[focus.x,focus.y],"position":[camera.position.x,camera.position.y,camera.position.z],"distance":distance,"pitch":pitch,"yaw":yaw,"fov":42},"meanFrameMs":mean,"p95FrameMs":sorted[int(sorted.size()*.95)] if sorted.size()>0 else 0,"samples":sorted.size(),"staticMemoryBytes":OS.get_static_memory_usage(),"renderVideoMemoryBytes":Performance.get_monitor(Performance.RENDER_VIDEO_MEM_USED),"drawCalls":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),"primitives":Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME),"residentTiles":resident.keys(),"startupMs":startup_ms,"tileLoadMs":loading_ms,"sites":sites.size(),"research":research.size(),"historicalScenery":false}
	metrics["maxFrameMs"]=sorted[-1] if sorted.size()>0 else 0
	metrics["regionalTerrain"]={"active":regional_active,"backdropGrid":regional_manifest.grid,"parentHeightChannel":"float UV2.x","materialDetail":regional_node.material_override.get_shader_parameter("detail_strength"),"vegetationTiles":scenery.roots.size(),"localVegetationCells":scenery.local_roots.size(),"vegetationInstancesResident":scenery.resident_instances(),"renderFrames":ready_frame}
	metrics["startupAndStreamingMaxFrameMs"]=peak_frame_ms
	var steady=settled_frame_times.duplicate();steady.sort()
	var steady_mean=0.0
	for v in steady:steady_mean+=v
	metrics["settledFrameStats"]={"samples":steady.size(),"meanMs":steady_mean/max(1,steady.size()),"p95Ms":steady[int(steady.size()*.95)] if not steady.is_empty() else 0,"maxMs":steady[-1] if not steady.is_empty() else 0,"method":"Consecutive frames after terrain reveal and queued scenery work finish; up to 300 samples. Separate from the legacy first-90-excluded sample used for baseline comparison."}
	metrics["frameTimeSource"]="Wall-clock process-frame intervals; first 90 frames excluded from steady-state sample."
	var file=FileAccess.open(capture_dir+"/godot-"+capture_name+".json",FileAccess.WRITE)
	file.store_string(JSON.stringify(metrics,"  "))
	print("CAPTURE_SAVED ",path," mean_ms=",mean," tiles=",resident.size())
	get_tree().quit()
