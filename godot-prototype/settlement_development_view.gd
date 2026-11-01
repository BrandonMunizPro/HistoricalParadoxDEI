extends Node3D
## One reusable adapter for data-defined slots. No settlement IDs in mesh logic.
var state
var city_ref:WeakRef
var camera_distance=0.0
var rendered_levels={}
var mesh_cache={}
func setup(model,city,distance):
	state=model;city_ref=weakref(city);camera_distance=distance
	state.changed.connect(rebuild);rebuild()
func rebuild():
	for child in get_children():remove_child(child);child.queue_free()
	rendered_levels.clear()
	var city=city_ref.get_ref();var showcase=city.showcase
	var proxy=showcase.proxy_scale(camera_distance)
	for slot in state.settlement.slots:
		if slot.building==null:continue
		var level=state.levels[slot.id];var asset=state.resolve_visual(slot.building.chain,level)
		var p=Vector3(slot.anchorM[0],0,slot.anchorM[1])*.001
		var origin=city.center+p*proxy;origin.y=showcase.surface(p) if camera_distance<15 else city.ground(p*proxy)+.0002
		if asset.is_empty():
			var label=Label3D.new();label.text="ART UNAVAILABLE\n"+slot.building.chain+" "+str(level);label.position=origin+Vector3.UP*.008*proxy;label.pixel_size=.00004*proxy;label.billboard=BaseMaterial3D.BILLBOARD_ENABLED;add_child(label)
			rendered_levels[slot.id]={"level":level,"missing":true};continue
		var path=asset.far if camera_distance>=3 else asset.near
		if not mesh_cache.has(path):mesh_cache[path]=load(path)
		origin=showcase.grounded_origin(p,deg_to_rad(slot.yawDegrees),1.,mesh_cache[path].get_aabb(),camera_distance)
		var instance=MeshInstance3D.new();instance.mesh=mesh_cache[path];instance.position=origin
		instance.basis=Basis(Vector3.UP,deg_to_rad(slot.yawDegrees)).scaled(Vector3.ONE*proxy)
		instance.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_ON if camera_distance<15 else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		instance.set_meta("slotId",slot.id);instance.set_meta("level",level);instance.set_meta("asset",asset.id);add_child(instance)
		rendered_levels[slot.id]={"level":level,"asset":asset.id,"path":path,"missing":false}
		if asset.has("environment"):
			var environment=preload("res://settlement_specialization_environment.gd").new();environment.name="Environment_"+slot.id;add_child(environment);environment.setup(city,slot,asset,camera_distance)
			rendered_levels[slot.id]["environment"]=environment.statistics.duplicate(true)
