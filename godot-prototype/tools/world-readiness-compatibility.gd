extends SceneTree
class Host:
	extends RefCounted
	var coastal_focus
func _initialize():
	var preparation=load("res://startup_preparation.gd").new();var host=Host.new()
	assert(not preparation.coast_baseline_ready(host))
	host.coastal_focus=load("res://coastal_focus.gd").new()
	assert(not preparation.coast_baseline_ready(host))
	host.coastal_focus.free()
	host.coastal_focus=load("res://world_coast.gd").new()
	assert(not preparation.coast_baseline_ready(host))
	host.coastal_focus.baseline_ready=true
	assert(preparation.coast_baseline_ready(host))
	host.coastal_focus.free();host.coastal_focus=null
	print("WORLD_READINESS_COMPATIBILITY PASS checks=4");quit()
