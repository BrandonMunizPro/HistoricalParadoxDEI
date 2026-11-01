extends SceneTree
var world
var received=false
var response={}
var checks=[]
func _initialize():call_deferred("run")
func got_probe(value):response=value;received=true
func probe(fft):
	received=false;RenderingServer.call_on_render_thread(fft.probe.bind(Callable(self,"got_probe")))
	while not received:await process_frame
	return response.duplicate(true)
func initialized(value):received=value
func captured():received=true
func capture_fft(fft,time):
	received=false;RenderingServer.call_on_render_thread(fft.capture.bind(time,Callable(self,"captured")))
	while not received:await process_frame
func validate_probe(data):
	assert(data.finite)
	for layer in data.layers:
		assert(layer.maxHeightMetres>0.00001 and layer.minHeightMetres<-.00001,"FFT must produce real signed waves")
		assert(layer.slopeEnergy>0. and layer.foamMax>=0. and layer.foamMax<=1.)
		assert(layer.previousMatches,"Temporal history and current mip chain must match at capture")
		assert(layer.displayMatchesCurrent,"GPU temporal resolve must preserve the exact current state at alpha=1")
		assert(layer.coarsestMoment[2]>0.,"Coarsest mip must retain unresolved wave energy")
func run():
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	var ocean=world.get_meta("ocean_renderer")
	await ocean.capture_time(0.)
	var a=await probe(ocean.fft);validate_probe(a)
	await ocean.capture_time(4.)
	var b=await probe(ocean.fft);validate_probe(b)
	for i in a.layers.size():assert(a.layers[i].displacementSha256!=b.layers[i].displacementSha256)
	checks.append({"test":"Balanced GPU FFT produces finite signed animated waves, moment mipmaps and synchronized histories","before":a,"after":b,"passed":true})
	var config=world.read_json("data/ocean-settings.json")
	assert(config.maximum_displacement_metres<1.,"Maximum crest must stay below existing one-metre land floor")
	checks.append({"test":"Conservative crest cap below land floor; geography masks unchanged","capMetres":config.maximum_displacement_metres,"passed":true})
	for name in ["low","high"]:
		var fft=load("res://ocean/fft.gd").new();received=false
		RenderingServer.call_on_render_thread(fft.initialize.bind(config,config.presets[name],Callable(self,"initialized")))
		while not received:await process_frame
		await capture_fft(fft,0.)
		var data=await probe(fft);validate_probe(data)
		assert(data.layers.size()==int(config.presets[name].cascades));assert(data.resolution==int(config.presets[name].resolution))
		checks.append({"test":"Native quality preset and FFT resource lifecycle","quality":name,"data":data,"passed":true})
		RenderingServer.call_on_render_thread(fft.release)
		await process_frame;await process_frame
	# Quantities and samples around the local mesh boundary are shared vertices,
	# with displacement tapering to zero before meeting the global base plane.
	for distance in [.12,.8,1.1,7.9,8.1,9.9,10.1,32.,520.]:
		world.distance=distance;world.goal_distance=distance;await process_frame;await process_frame
		assert(ocean.patch.visible==(distance<10.))
		var mode="resolved" if distance<1. else ("histories" if distance<8. else "far")
		assert(ocean.normal_mode==mode)
		for mat in ocean.materials:assert(mat.get_shader_parameter("fft_normal")== (ocean.fft.display_normal if mode=="resolved" else ocean.fft.normal))
		checks.append({"test":"Distance-dependent geometry budget","distanceKm":distance,"patchVisible":ocean.patch.visible,"passed":true})
	var shader=FileAccess.get_file_as_string("res://ocean/ocean_surface.gdshader")
	var legacy=FileAccess.get_file_as_string("res://water.gdshader")
	for expression in ["if(land>.5&&source_ground<.5)discard;","coast_coverage(regional_land,rq)","texture(regional_ocean,rq).r","texture(global_ocean,gq).r"]:
		assert(expression in shader and expression in legacy)
	checks.append({"test":"Legacy ocean/inland exclusion and shared coast-mask predicates retained","passed":true})
	world.distance=.8;world.goal_distance=.8;ocean.resume_animation();world.set_water_animation(false)
	var updates=ocean.metrics.computeUpdates
	for i in 20:await process_frame
	assert(ocean.metrics.computeUpdates==updates)
	checks.append({"test":"Existing animation toggle pauses FFT scheduling","passed":true})
	world.set_water_animation(true)
	for i in 30:await process_frame
	assert(ocean.metrics.computeUpdates>updates)
	checks.append({"test":"Existing animation toggle resumes FFT scheduling","passed":true})
	FileAccess.open("res://evidence/ocean-20261028/native-validation-final.json",FileAccess.WRITE).store_string(JSON.stringify({"passed":true,"checks":checks,"count":checks.size(),"notice":"Structural and GPU correctness, not independent artistic approval"},"  "))
	print("OCEAN_VALIDATION_OK ",checks.size());quit()
