extends SceneTree
func _initialize():
	var navigation=load("res://navigation.gd").new()
	var read=func(p):return JSON.parse_string(FileAccess.get_file_as_string("res://data/"+p))
	var core=read.call("production-views.json")
	var global=read.call("global-views.json")
	var capture=read.call("visual-views.json")
	assert(navigation.configure(core,global))
	var expected={"greece":95.0,"anatolia":150.0,"egypt":180.0,"east":320.0,"alps":100.0,"apennines":85.0,"sicily":520.0}
	for key in expected:
		assert(navigation.resolve(key)[2]==expected[key],"Production camera changed: "+key)
		assert(capture.has(key) and capture[key][2]!=expected[key],"Regression fixture must collide with a different capture distance")
	var before=navigation.presets.duplicate(true)
	assert(not navigation.configure(before,capture),"Duplicate capture names silently overwrote production")
	assert(navigation.presets==before,"A rejected merge changed existing presets")
	assert(not navigation.configure(core,{"alps":[0,0,1,0,0]}))
	var returned=navigation.resolve("greece");returned[2]=9999
	assert(navigation.resolve("greece")[2]==95.0,"Caller mutated the registry")
	assert(navigation.resolve("zagros").is_empty(),"Capture-only name leaked into production")
	assert(navigation.resolve("unknown").is_empty(),"Unknown name silently fell back")
	print("NAVIGATION_REGRESSION_OK original_distances=7 rejected_collisions=2 isolated_capture_names=true")
	quit()
