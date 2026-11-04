extends SceneTree
func _initialize():call_deferred("run")
func slots(node):
	var values=[]
	for i in node.multimesh.instance_count:values.append(node.multimesh.get_instance_transform(i));values.append(node.multimesh.get_instance_color(i))
	return var_to_bytes(values).hex_encode().sha256_text()
func run():
	Engine.max_fps=120
	var world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	world.focus=Vector2(14.25287,40.839995);world.goal_focus=world.focus;world.distance=60.;world.goal_distance=60.;world.queue_tiles()
	await settle(world)
	world.distance=1.5;world.goal_distance=1.5;world.queue_tiles()
	await settle(world)
	var id="1f50fd31-a377-5df8-b182-d84e962aed97";var renderer=world.settlements
	assert(renderer.nodes.has(id));var baseline=slots(renderer.nodes[id]);var count=renderer.nodes[id].multimesh.instance_count
	var owners=world.political_map.factions.regions.export_state();var others={}
	for other in renderer.nodes:
		if other!=id:others[other]=renderer.nodes[other]
	renderer.set_neapolis_trial(true);await settle(world)
	var node=renderer.nodes[id]
	assert(slots(node)==baseline and node.get_meta("neapolis_slot_hash")==baseline)
	assert(node.multimesh.visible_instance_count==0 and node.multimesh.instance_count==count)
	assert(node.get_child_count()==3 and node.get_meta("neapolis_geometry").mainPassSurfaceGroups==7)
	var origins=[]
	for i in count:origins.append(node.multimesh.get_instance_transform(i).origin)
	for child in node.get_children():
		for i in child.multimesh.instance_count:assert(child.multimesh.get_instance_transform(i).origin in origins,"Changed existing ground placement")
	for other in others:assert(renderer.nodes[other]==others[other],"Another settlement rebuilt")
	assert(world.political_map.factions.regions.export_state()==owners)
	var geometry=node.get_meta("neapolis_geometry").duplicate(true)
	world.distance=4.;world.goal_distance=4.;await settle(world)
	assert(renderer.nodes[id].get_meta("neapolis_lod")=="far")
	renderer.set_neapolis_trial(false);await settle(world)
	assert(renderer.nodes[id].multimesh.visible_instance_count==-1 and renderer.nodes[id].get_child_count()==0)
	world.distance=1.5;world.goal_distance=1.5;await settle(world)
	assert(slots(renderer.nodes[id])==baseline)
	FileAccess.open("res://evidence/neapolis-free/native-verification.json",FileAccess.WRITE).store_string(JSON.stringify({"passed":true,"sameBaselineSlots":true,"baselineSlotHash":baseline,"slotCount":count,"otherResidentSettlementsUnchanged":others.size(),"ownersUnchanged":true,"reversible":true,"nearFarSwitch":true,"geometry":geometry},"  "))
	print("NEAPOLIS_FREE_NATIVE_OK ",JSON.stringify(geometry))
	world.queue_free()
	for i in 30:await process_frame
	quit()
func settle(world):
	for i in 12000:
		await process_frame
		if i>120 and world.is_settled():return
	assert(false,"Readiness timeout")
