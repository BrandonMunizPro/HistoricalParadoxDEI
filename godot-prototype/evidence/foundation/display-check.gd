extends SceneTree
func _initialize():
	print("PRESENTATION_MODE ",JSON.stringify({"vsyncMode":DisplayServer.window_get_vsync_mode(),"refreshHz":DisplayServer.screen_get_refresh_rate(),"engineFpsCap":Engine.max_fps,"gpu":RenderingServer.get_video_adapter_name()}))
	quit()
