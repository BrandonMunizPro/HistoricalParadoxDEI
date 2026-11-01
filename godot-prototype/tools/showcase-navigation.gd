extends "res://tools/roma-profile.gd"
## Identical existing navigation route, forcing one actual render per interval.
func _initialize():
	RenderingServer.render_loop_enabled=false
	process_frame.connect(force_render)
	call_deferred("run")
func force_render():RenderingServer.force_draw(false)
