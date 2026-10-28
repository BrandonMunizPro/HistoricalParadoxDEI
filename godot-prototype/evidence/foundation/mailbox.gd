extends "res://tools/visual-capture.gd"
func run():
	super.run()
	var world=root.get_child(0)
	DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_MAILBOX)
	Engine.max_fps=120
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(world.capture_dir))
	var file=FileAccess.open(world.capture_dir+"/configuration.json",FileAccess.WRITE)
	file.store_string(JSON.stringify({"diagnosticOnly":true,"vsyncMode":DisplayServer.window_get_vsync_mode(),"refreshHz":DisplayServer.screen_get_refresh_rate(),"engineFpsCap":Engine.max_fps,"evidence":world.evidence_metadata()},"  "))

