extends Node
## Paint the loading screen before synchronously constructing the campaign scene.
func _ready():
	var cover=preload("res://detail_loading.gd").new();add_child(cover)
	await get_tree().process_frame
	await RenderingServer.frame_post_draw
	var error=ResourceLoader.load_threaded_request("res://world.tscn")
	if error!=OK:cover.message.text="The campaign could not be loaded.";return
	while ResourceLoader.load_threaded_get_status("res://world.tscn")==ResourceLoader.THREAD_LOAD_IN_PROGRESS:await get_tree().process_frame
	if ResourceLoader.load_threaded_get_status("res://world.tscn")!=ResourceLoader.THREAD_LOAD_LOADED:cover.message.text="The campaign could not be loaded.";return
	var scene=ResourceLoader.load_threaded_get("res://world.tscn")
	var campaign=scene.instantiate();campaign.startup_preparation_requested=true;add_child(campaign)
	cover.queue_free()
