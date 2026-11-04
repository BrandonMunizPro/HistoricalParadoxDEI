extends RefCounted
## Single-world presentation adapter. Scenario faction control remains a separate
## data/render adapter; no economy, diplomacy, characters or army rules.
var world
var settings={}
var blend=0.
var enabled=true
var factions
var points:MultiMeshInstance3D
var point_material:ShaderMaterial
var geometry=[]
var last_geometry_blend=-1.
var metrics={"blend":0.,"layersBound":false,"boundariesBound":false,"approvedMarkers":35}
func _init(owner):
	world=owner;settings=world.read_json("data/political-map-settings.json")
	assert(settings.transition_begin_km>0. and settings.transition_full_km>settings.transition_begin_km)
	enabled=settings.enabled and not OS.get_cmdline_user_args().has("--geographic-only")
	for pair in [["political_neutral","neutral_land_linear"],["political_sea_deep","strategic_sea_deep_linear"],["political_sea_coast","strategic_sea_coast_linear"]]:
		var v=settings[pair[1]];RenderingServer.global_shader_parameter_set(pair[0],Vector4(v[0],v[1],v[2],1.))
	clear_cartography_layers()
	RenderingServer.global_shader_parameter_set("political_coast_band_km",settings.strategic_coast_band_km)
	RenderingServer.global_shader_parameter_set("political_blend",0.)
func initialize_markers():
	points=MultiMeshInstance3D.new();points.name="ApprovedPoliticalSettlementPoints"
	var mm=MultiMesh.new();mm.transform_format=MultiMesh.TRANSFORM_3D;mm.use_custom_data=true;mm.mesh=QuadMesh.new();mm.instance_count=world.sites.size();points.multimesh=mm
	point_material=ShaderMaterial.new();point_material.shader=load("res://political_marker.gdshader");points.material_override=point_material
	points.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;points.custom_aabb=AABB(Vector3(-20000,-10000,-20000),Vector3(40000,40000,40000));points.visible=false
	world.add_child(points)
	for root in [world.vegetation_root,world.city_root,world.settlements.root]:observe_detail(root)
	factions=preload("res://faction_cartography.gd").new(world,self)
func observe_detail(node):
	if node is GeometryInstance3D:
		geometry.append(weakref(node));node.transparency=smoothstep(0.,.45,blend)
	if not node.child_entered_tree.is_connected(observe_detail):node.child_entered_tree.connect(observe_detail)
	for child in node.get_children():observe_detail(child)
func weight_at(distance):return smoothstep(settings.transition_begin_km,settings.transition_full_km,distance) if enabled else 0.
func update():
	var next=weight_at(world.distance)
	if next!=blend:
		blend=next;RenderingServer.global_shader_parameter_set("political_blend",blend)
	metrics.blend=blend
	if factions!=null:factions.update()
	var detail_fade=smoothstep(0.,.45,blend)
	if last_geometry_blend!=detail_fade:
		var live=[]
		for ref in geometry:
			var node=ref.get_ref()
			if node!=null:node.transparency=1.-(1.-detail_fade)*float(node.get_meta("scenery_reveal",1.));live.append(ref)
		geometry=live;last_geometry_blend=detail_fade
	if points==null:return
	world.vegetation_root.visible=world.vegetation_root.visible and detail_fade<1.
	world.settlements.root.visible=detail_fade<1.
	points.visible=blend>0.
	if blend<=0.:return
	var viewport=world.get_viewport().get_visible_rect().size
	point_material.set_shader_parameter("marker_size",world.distance*2.*tan(deg_to_rad(world.camera.fov*.5))*settings.marker_pixels/max(1.,viewport.y))
	for i in world.markers.size():
		var m=world.markers[i];points.multimesh.set_instance_transform(i,Transform3D(Basis.IDENTITY,m.label.position));points.multimesh.set_instance_custom_data(i,Color(1. if world.selected==m.site.key else 0.,0,0,1))
func clear_cartography_layers():
	RenderingServer.global_shader_parameter_set("political_ids_mode",false)
	RenderingServer.global_shader_parameter_set("political_layers_enabled",false)
	RenderingServer.global_shader_parameter_set("political_boundaries_enabled",false)
	RenderingServer.global_shader_parameter_set("political_color_layer",preload("res://political_empty_layer.tres"))
	RenderingServer.global_shader_parameter_set("political_boundary_layer",preload("res://political_empty_layer.tres"))
	metrics.layersBound=false;metrics.boundariesBound=false
func set_cartography_layers(colors:Texture2D,boundaries:Texture2D,bounds:Rect2)->bool:
	# Rendering input only: no IDs, faction objects, transfers, or generated borders.
	# Bounds are lon/lat degrees in the existing geographic coordinate system.
	if colors==null:clear_cartography_layers();return true
	if bounds.size.x<=0. or bounds.size.y<=0. or bounds.position.x< -180. or bounds.end.x>180. or bounds.position.y< -90. or bounds.end.y>90.:return false
	RenderingServer.global_shader_parameter_set("political_color_layer",colors)
	RenderingServer.global_shader_parameter_set("political_layer_bounds",Vector4(bounds.position.x,bounds.position.y,bounds.size.x,bounds.size.y))
	RenderingServer.global_shader_parameter_set("political_layers_enabled",true)
	RenderingServer.global_shader_parameter_set("political_boundaries_enabled",boundaries!=null)
	if boundaries!=null:RenderingServer.global_shader_parameter_set("political_boundary_layer",boundaries)
	metrics.layersBound=true;metrics.boundariesBound=boundaries!=null;return true
