extends SceneTree
func _initialize():call_deferred("run")
func run():
	var config=JSON.parse_string(FileAccess.get_file_as_string("res://data/environment-presentation.json"))
	assert(config.geology_fields.size()<=8)
	assert(config.families.size()==4 and config.scenery.max_instances_per_cell<=1800)
	var factory=load("res://canopy_assets.gd").new()
	for family in 6:
		for variant in 4:
			var mesh=factory.build(family,variant)
			assert(mesh.get_surface_count()==2)
			for surface in 2:
				var arrays=mesh.surface_get_arrays(surface)
				var vertices=arrays[Mesh.ARRAY_VERTEX]
				for index in arrays[Mesh.ARRAY_INDEX]:assert(index>=0 and index<vertices.size())
	var climate=Image.create(64,64,false,Image.FORMAT_RGBA8)
	for y in 64:
		for x in 64:climate.set_pixel(x,y,Color(.5,float(x)/63,float(x)/63,float(y%16)/15))
	var viewport=SubViewport.new();viewport.size=Vector2i(64,64)
	viewport.render_target_update_mode=SubViewport.UPDATE_ALWAYS;root.add_child(viewport)
	var rectangle=ColorRect.new();rectangle.size=Vector2(64,64)
	var shader=Shader.new()
	shader.code="shader_type canvas_item;\n#include \"res://environment.gdshaderinc\"\nuniform sampler2D climates:filter_nearest;void fragment(){float latitude=12.0+floor(UV.y*64.0)/63.0*50.0;vec4 weights=environment_weights(latitude,texture(climates,UV));COLOR=vec4(weights.xyz,1.0);}"
	var material=ShaderMaterial.new();material.shader=shader
	var lr=config.latitude_rules;var dr=config.dry_river_rules
	material.set_shader_parameter("environment_latitude_rules",Vector4(lr[0],lr[1],lr[2],lr[3]))
	material.set_shader_parameter("environment_dry_river_rules",Vector4(dr[0],dr[1],dr[2],dr[3]))
	material.set_shader_parameter("climates",ImageTexture.create_from_image(climate))
	rectangle.material=material;viewport.add_child(rectangle)
	for frame in 8:await process_frame
	RenderingServer.force_draw()
	var output=viewport.get_texture().get_image()
	var rules=load("res://environment_rules.gd")
	var maximum=0.0
	for y in 64:
		for x in 64:
			var expected=rules.blend_weights(12.0+float(y)/63*50,climate.get_pixel(x,y),lr,dr)
			assert(abs(expected.x+expected.y+expected.z+expected.w-1)<.00001)
			var actual=output.get_pixel(x,y)
			maximum=max(maximum,max(abs(expected.x-actual.r),max(abs(expected.y-actual.g),abs(expected.z-actual.b))))
	assert(maximum<.005,"CPU/GPU environmental families diverged")
	print("ENVIRONMENT_GPU_VALIDATION_OK samples=4096 palette=24 maximum_error=",maximum)
	quit()
