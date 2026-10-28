extends SceneTree
func _initialize():call_deferred("run")
func run():
	var settings=JSON.parse_string(FileAccess.get_file_as_string("res://data/environment-presentation.json")).north_africa
	var rules=load("res://environment_rules.gd")
	for p in [Vector2(14.23,40.82),Vector2(15.08,37.52),Vector2(16.4,43.4)]:assert(rules.scope_strength(p.x,p.y,settings.scope_rules)==0.0)
	assert(rules.scope_strength(31.15,30.95,settings.scope_rules)==1.0)
	assert(rules.plain_strength(Color(0,1,0,0),0.01,0,settings.plain_rules)==1.0)
	assert(rules.plain_strength(Color(0,0,0,0),0.01,0,settings.plain_rules)==0.0)
	assert(rules.plain_strength(Color(0,1,0,0),1.0,0,settings.plain_rules)==0.0)
	var shader_stub=Shader.new();shader_stub.code="shader_type spatial; uniform sampler2D quality_rock;"
	var stub_material=ShaderMaterial.new();stub_material.shader=shader_stub
	var cfg=JSON.parse_string(FileAccess.get_file_as_string("res://data/environment-presentation.json"))
	var scenery=load("res://regional_scenery.gd").new({"presentation":{"settings":cfg},"base_material":stub_material})
	assert(scenery.arid_rocks.size()==4)
	for i in 4:
		var original=scenery.meshes[24+i].surface_get_arrays(0)
		var solid=scenery.arid_rocks[i].surface_get_arrays(0)
		assert(original[Mesh.ARRAY_VERTEX]==solid[Mesh.ARRAY_VERTEX])
		assert(solid[Mesh.ARRAY_NORMAL][87].y>0.0,"Rock cap must face upward")
		var indices=solid[Mesh.ARRAY_INDEX]
		assert(indices.size()==solid[Mesh.ARRAY_VERTEX].size())
		for j in range(0,indices.size(),3):assert(indices[j]==j and indices[j+1]==j+2 and indices[j+2]==j+1)
	var viewport=SubViewport.new();viewport.size=Vector2i(64,64);viewport.render_target_update_mode=SubViewport.UPDATE_ALWAYS;root.add_child(viewport)
	var rectangle=ColorRect.new();rectangle.size=Vector2(64,64)
	var shader=Shader.new();shader.code="shader_type canvas_item;\n#include \"res://north_africa.gdshaderinc\"\nvoid fragment(){float x=floor(UV.x*64.0)/63.0;float y=floor(UV.y*64.0)/63.0;COLOR=vec4(na_scope(vec2(5.0+x*35.0,12.0+y*32.0)),na_plain(vec4(0.0,x,0.0,0.0),y,0.0),0.0,1.0);}"
	var material=ShaderMaterial.new();material.shader=shader
	var s=settings.scope_rules;var p=settings.plain_rules
	material.set_shader_parameter("na_scope_rules",Vector4(s[0],s[1],s[2],s[3]));material.set_shader_parameter("na_plain_rules",Vector4(p[0],p[1],p[2],p[3]))
	rectangle.material=material;viewport.add_child(rectangle)
	for frame in 8:await process_frame
	RenderingServer.force_draw();var output=viewport.get_texture().get_image();var maximum=0.0
	for y in 64:
		for x in 64:
			var actual=output.get_pixel(x,y)
			var scope=rules.scope_strength(5.0+float(x)/63*35,12.0+float(y)/63*32,s)
			var plain=rules.plain_strength(Color(0,float(x)/63,0,0),float(y)/63,0,p)
			maximum=max(maximum,max(abs(scope-actual.r),abs(plain-actual.g)))
	assert(maximum<.006,"North African CPU/GPU presentation rules diverged")
	print("NORTH_AFRICA_GPU_OK samples=4096 baseline_scopes=0 maximum_error=",maximum)
	viewport.queue_free()
	var world=load("res://world.tscn").instantiate();root.add_child(world)
	assert(world.jump("egypt"))
	var begin=Time.get_ticks_msec()
	while not world.is_settled() and Time.get_ticks_msec()-begin<90000:await process_frame
	assert(world.is_settled(),"Nile water control validation timed out")
	assert(world.nile_material!=null,"Production Egypt must instantiate its river material")
	world.set_water_animation(false)
	var frozen=world.water_time
	for frame in 12:await process_frame
	assert(world.water_time==frozen)
	assert(abs(world.nile_material.get_shader_parameter("water_time")-frozen)<.0001)
	world.set_water_animation(true)
	for frame in 12:await process_frame
	assert(world.water_time>frozen)
	assert(abs(world.nile_material.get_shader_parameter("water_time")-world.water_time)<.0001)
	print("NILE_STATIC_AND_ANIMATED_CONTROL_OK production=true")
	quit()


