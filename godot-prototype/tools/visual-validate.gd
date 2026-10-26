extends SceneTree
var world
var output=""
func _initialize():call_deferred("run")

func finish(passed,message,details={}):
 details.merge({"passed":passed,"message":message,"evidence":world.evidence_metadata(),"cameraPath":"water-diagnostic"})
 var file=FileAccess.open(output+"/water.json",FileAccess.WRITE)
 file.store_string(JSON.stringify(details,"  "))
 print("WATER_VALIDATION_"+("OK" if passed else "FAIL")+" "+message)
 quit(0 if passed else 1)

func snapshot(name):
 await process_frame
 RenderingServer.force_draw()
 var image=root.get_texture().get_image()
 image.save_png(output+"/"+name+".png")
 var digest=HashingContext.new();digest.start(HashingContext.HASH_SHA256)
 digest.update(image.get_region(Rect2i(700,450,600,300)).get_data())
 return digest.finish().hex_encode()

func run():
 world=load("res://world.tscn").instantiate();root.add_child(world)
 output=world.capture_dir
 DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
 world.camera_path="water-diagnostic"
 world.focus=Vector2(16.2,36.5);world.goal_focus=world.focus
 world.distance=35.0;world.goal_distance=35.0;world.pitch=40.0;world.yaw=0.0
 world.queue_tiles()
 var begin=Time.get_ticks_msec()
 while not world.is_settled() or world.settled_frame_times.size()<30:
  await process_frame
  if Time.get_ticks_msec()-begin>90000:finish(false,"Timed out waiting for water view scenery");return
 world.set_water_animation(false);world.water_time=8.0
 world.water_material.set_shader_parameter("water_time",world.water_time)
 var position=world.camera.transform;var height=world.elevation(15.088142,37.502959)
 var a=await snapshot("static-a")
 await create_timer(.5).timeout
 var b=await snapshot("static-b")
 if a!=b:finish(false,"Static water changed");return
 world.set_water_animation(true)
 await create_timer(1.0).timeout
 var c=await snapshot("animated")
 if a==c:finish(false,"Animated water did not change");return
 if world.camera.transform!=position or not is_equal_approx(world.elevation(15.088142,37.502959),height):finish(false,"Water changed camera or terrain");return
 world.set_water_animation(false);var frozen=world.water_time
 await create_timer(.2).timeout
 if world.water_time!=frozen:finish(false,"Static clock advanced");return
 finish(true,"Static and animated GPU patches; unchanged camera and terrain",{"staticPatchHashes":[a,b],"animatedPatchHash":c,"sceneryReady":world.scenery.is_ready()})
