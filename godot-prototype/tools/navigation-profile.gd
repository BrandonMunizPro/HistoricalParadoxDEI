extends SceneTree
var world

func _initialize():call_deferred("run")

func wait_ready():
	var begin=Time.get_ticks_msec()
	while Time.get_ticks_msec()-begin<90000:
		await process_frame
		if abs(world.distance-world.goal_distance)<.0001 and world.is_settled() and world.settled_frame_times.size()>=180:return true
	return false

func run():
	world=load("res://world.tscn").instantiate()
	root.add_child(world)
	if not await wait_ready():push_error("Initial production view failed to settle");quit(1);return
	world.jump("apennines")
	var start=Time.get_ticks_msec()
	var last_distance=world.distance
	var last_height=world.elevation(13.58,42.43)
	var max_step=0.0;var max_height_step=0.0
	while true:
		await process_frame
		max_step=max(max_step,abs(world.distance-last_distance)/last_distance)
		var height=world.elevation(13.58,42.43)
		max_height_step=max(max_height_step,abs(height-last_height))
		last_height=height;last_distance=world.distance
		if abs(world.distance-85.0)<.0001 and world.is_settled() and world.settled_frame_times.size()>=180:break
		if Time.get_ticks_msec()-start>90000:push_error("Production approach failed to settle");quit(1);return
	if world.goal_distance!=85.0:push_error("Wrong production approach distance");quit(1);return
	if max_step>.080001:push_error("Production zoom exceeded step cap");quit(1);return
	world.navigation_trace={"from":"campaign","to":"apennines","maxRelativeDistanceStep":max_step,"maxFixedLocationHeightStepMetres":max_height_step*1000,"elapsedMs":Time.get_ticks_msec()-start}
	world.capture_name="production-approach"
	world.capture_done=true
	world.capture()
