extends SceneTree
var world
func _initialize():call_deferred("run")
func run():
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	var site
	for s in world.sites:
		if s.key=="aricia":site=s
	var records=[]
	for distance in [2.9,3.1,14.9,15.1,2.9]:
		world.focus=Vector2(site.lon,site.lat);world.goal_focus=world.focus;world.distance=distance;world.goal_distance=distance;world.queue_tiles()
		var begin=Time.get_ticks_msec();var frames=0
		while Time.get_ticks_msec()-begin<60000:
			await process_frame;frames+=1
			if frames>120 and world.is_settled():break
		assert(world.is_settled())
		var node=world.settlements.nodes[site.id];var slots=node.find_child("DevelopmentSlots",true,false);assert(slots!=null)
		var slot=slots.rendered_levels["aricia-slot-1"]
		assert(slot.path.ends_with("-far.res")==bool(distance>=3),"LOD must refresh at threshold, not only at the next distance bucket")
		assert((slot.environment.cultivatedFields>0)==bool(distance<15),"Field culling threshold must refresh its resident node")
		records.append({"distance":distance,"path":slot.path,"fields":slot.environment.cultivatedFields,"nodeLod":node.get_meta("identity_lod")})
	var file=FileAccess.open("res://evidence/settlement-identities-20261028/lod-validation.json",FileAccess.WRITE);file.store_string(JSON.stringify({"passed":true,"roundTrip":records},"  "));file.close();print("IDENTITY_LOD_OK");quit()
