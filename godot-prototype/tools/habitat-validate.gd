extends SceneTree
## Actual GPU/CPU agreement, not a duplicate CPU implementation of the shader.
func _initialize():call_deferred("run")
func run():
	var viewport=SubViewport.new();viewport.size=Vector2i(64,64)
	viewport.render_target_update_mode=SubViewport.UPDATE_ALWAYS
	root.add_child(viewport)
	var rectangle=ColorRect.new();rectangle.size=Vector2(64,64)
	var shader=Shader.new()
	shader.code="shader_type canvas_item;\n#include \"res://habitat.gdshaderinc\"\nvoid fragment(){vec2 p=(floor(UV*64.0)+.5)*.71-vec2(22.0);COLOR=vec4(vec3(habitat_cover(p,.55,.4,.2)),1.0);}"
	var material=ShaderMaterial.new();material.shader=shader
	rectangle.material=material;viewport.add_child(rectangle)
	for frame in 8:await process_frame
	RenderingServer.force_draw()
	var image=viewport.get_texture().get_image()
	var habitat=load("res://habitat.gd")
	var maximum_error=0.0
	for y in 64:
		for x in 64:
			var p=(Vector2(x,y)+Vector2(.5,.5))*.71-Vector2(22,22)
			var expected=habitat.cover(p,.55,.4,.2)
			maximum_error=max(maximum_error,abs(expected-image.get_pixel(x,y).r))
	assert(maximum_error<.005,"CPU and rendered GPU habitat disagree")
	assert(habitat.cover(Vector2(-120,400),.5,.5,3.0)==0.0,"Alpine exclusion failed")
	print("HABITAT_GPU_VALIDATION_OK samples=4096 maximum_error=",maximum_error)
	quit()
