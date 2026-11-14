extends RefCounted
## Adapted GodotOceanWaves GPU pipeline, MIT Ethan Truong 2024.
## All RenderingDevice work runs on the render thread. No frame-loop readbacks.
var context:OceanRenderContext
var rd:RenderingDevice
var descriptors={}
var pipelines={}
var parameters:Array[OceanCascadeParameters]=[]
var mip_passes=[]
var display_mip_passes=[]
var last_presented_alpha=-1.
var last_presented_update=-1
var normal_views=[]
var displacement=Texture2DArrayRD.new()
var normal=Texture2DArrayRD.new()
var previous_displacement=Texture2DArrayRD.new()
var previous_normal=Texture2DArrayRD.new()
var display_normal=Texture2DArrayRD.new()
var n=256
var layers=3
var levels=9
var ready=false
var released=false
var metrics={"updates":0,"dispatchCpuMs":0.,"maxDispatchCpuMs":0.,"gpuDeltaRaw":[],"readbacksDuringPlay":0}
func initialize(settings,quality,callback):
	rd=RenderingServer.get_rendering_device()
	if rd==null:callback.call_deferred(false);return
	n=int(quality.resolution);layers=int(quality.cascades);levels=int(log(n)/log(2))+1
	context=OceanRenderContext.create(rd)
	var shaders={}
	for name in ["spectrum_compute","fft_butterfly","spectrum_modulate","transpose","fft_unpack","normal_mip","temporal_normal"]:shaders[name]=context.load_shader("res://ocean/compute/"+name+".glsl")
	shaders.fft=context.load_shader("res://ocean/compute/fft_"+str(n)+".glsl")
	var usage=RenderingDevice.TEXTURE_USAGE_STORAGE_BIT|RenderingDevice.TEXTURE_USAGE_SAMPLING_BIT|RenderingDevice.TEXTURE_USAGE_CAN_COPY_FROM_BIT|RenderingDevice.TEXTURE_USAGE_CAN_COPY_TO_BIT|RenderingDevice.TEXTURE_USAGE_CAN_UPDATE_BIT
	var dims=Vector2i(n,n)
	descriptors.spectrum=context.create_texture(dims,RenderingDevice.DATA_FORMAT_R16G16B16A16_SFLOAT,usage,layers)
	descriptors.butterfly=context.create_storage_buffer((levels-1)*n*16)
	descriptors.fft=context.create_storage_buffer(layers*n*n*64)
	for key in ["displacement","previous_displacement","normal","previous_normal","display_normal"]:
		descriptors[key]=context.create_texture(dims,RenderingDevice.DATA_FORMAT_R16G16B16A16_SFLOAT,usage,layers,RDTextureView.new(),PackedByteArray(),levels if key.contains("normal") else 1)
		rd.texture_clear(descriptors[key].rid,Color(0,0,0,0),0,levels if key.contains("normal") else 1,0,layers)
	displacement.texture_rd_rid=descriptors.displacement.rid;normal.texture_rd_rid=descriptors.normal.rid
	previous_displacement.texture_rd_rid=descriptors.previous_displacement.rid;previous_normal.texture_rd_rid=descriptors.previous_normal.rid
	display_normal.texture_rd_rid=descriptors.display_normal.rid
	var spectrum_set=context.create_descriptor_set([descriptors.spectrum],shaders.spectrum_compute,0)
	var modulate_set=context.create_descriptor_set([descriptors.spectrum],shaders.spectrum_modulate,0)
	var butterfly_set=context.create_descriptor_set([descriptors.butterfly],shaders.fft_butterfly,0)
	var fft_set=context.create_descriptor_set([descriptors.butterfly,descriptors.fft],shaders.fft,0)
	var buffer_set=context.create_descriptor_set([descriptors.fft],shaders.spectrum_modulate,1)
	var unpack_set=context.create_descriptor_set([descriptors.displacement,descriptors.normal],shaders.fft_unpack,0)
	pipelines.spectrum=context.create_pipeline([n/16,n/16,1],[spectrum_set],shaders.spectrum_compute)
	pipelines.modulate=context.create_pipeline([n/16,n/16,1],[modulate_set,buffer_set],shaders.spectrum_modulate)
	pipelines.butterfly=context.create_pipeline([n/128,levels-1,1],[butterfly_set],shaders.fft_butterfly)
	pipelines.fft=context.create_pipeline([1,n,4],[fft_set],shaders.fft)
	pipelines.transpose=context.create_pipeline([n/32,n/32,4],[fft_set],shaders.transpose)
	pipelines.unpack=context.create_pipeline([n/16,n/16,1],[unpack_set,buffer_set],shaders.fft_unpack)
	var temporal_set=context.create_descriptor_set([descriptors.previous_normal,descriptors.normal,descriptors.display_normal],shaders.temporal_normal,0)
	pipelines.temporal=context.create_pipeline([n/8,n/8,layers],[temporal_set],shaders.temporal_normal)
	for target in ["normal","display_normal"]:
		for layer in layers:
			var views:Array[OceanRenderContext.Descriptor]=[]
			for mip in levels:
				var view=rd.texture_create_shared_from_slice(RDTextureView.new(),descriptors[target].rid,layer,mip,1,RenderingDevice.TEXTURE_SLICE_2D)
				context.deletion_queue.push(view);views.append(OceanRenderContext.Descriptor.new(view,RenderingDevice.UNIFORM_TYPE_IMAGE))
			for mip in range(1,levels):
				var set=context.create_descriptor_set([views[mip-1],views[mip]],shaders.normal_mip,0)
				var size=n>>mip
				var callback_mip=context.create_pipeline([ceili(size/8.),ceili(size/8.),1],[set],shaders.normal_mip)
				if target=="normal":mip_passes.append(callback_mip)
				else:display_mip_passes.append(callback_mip)
	for layer in layers:
		var entry=settings.cascades[layer]
		var p=OceanCascadeParameters.new();p.tile_length=Vector2.ONE*entry.tile_metres
		p.wind_speed=entry.wind_speed*settings.wind_speed_multiplier;p.wind_direction=settings.wind_direction_degrees
		p.fetch_length=entry.fetch_km;p.swell=.35;p.spread=.35;p.detail=.85;p.whitecap=.65;p.foam_amount=.8
		p.spectrum_seed=Vector2i(1234+layer*7919,278+layer*101);parameters.append(p)
	var list=rd.compute_list_begin();pipelines.butterfly.call(context,list);rd.compute_list_end()
	ready=true
	update_at(0.,1./24.,true)
	present(1.)
	metrics["allocatedTextureAndFFTBytesEstimate"]=layers*n*n*(64+8+16+24*4./3.)+(levels-1)*n*16
	callback.call_deferred(true)
func copy_previous():
	for layer in layers:
		rd.texture_copy(descriptors.displacement.rid,descriptors.previous_displacement.rid,Vector3.ZERO,Vector3.ZERO,Vector3(n,n,1),0,0,layer,layer)
		for mip in levels:
			var size=n>>mip
			rd.texture_copy(descriptors.normal.rid,descriptors.previous_normal.rid,Vector3.ZERO,Vector3.ZERO,Vector3(size,size,1),mip,mip,layer,layer)
func update_at(time,delta,copy_after=false):
	if not ready or released:return
	var begin=Time.get_ticks_usec()
	# Collect delayed timestamp results, never sync the GPU for timing.
	var start_tick=-1
	for i in rd.get_captured_timestamps_count():
		var label=rd.get_captured_timestamp_name(i)
		if label=="CampaignOceanFFT/start":start_tick=rd.get_captured_timestamp_gpu_time(i)
		elif label=="CampaignOceanFFT/end" and start_tick>=0:
			metrics.gpuDeltaRaw.append(rd.get_captured_timestamp_gpu_time(i)-start_tick)
			if metrics.gpuDeltaRaw.size()>1200:metrics.gpuDeltaRaw.pop_front()
	if not copy_after:copy_previous()
	rd.capture_timestamp("CampaignOceanFFT/start")
	var list=rd.compute_list_begin()
	for i in layers:
		var p=parameters[i]
		if p.should_generate_spectrum:
			var alpha=.076*pow(p.wind_speed*p.wind_speed/(p.fetch_length*1000.*9.81),.22)
			var peak=22.*pow(9.81*9.81/(p.wind_speed*p.fetch_length*1000.),1./3.)
			pipelines.spectrum.call(context,list,OceanRenderContext.create_push_constant([p.spectrum_seed.x,p.spectrum_seed.y,p.tile_length.x,p.tile_length.y,alpha,peak,p.wind_speed,deg_to_rad(p.wind_direction),20.,p.swell,p.detail,p.spread,i]))
			p.should_generate_spectrum=false;rd.compute_list_add_barrier(list)
		pipelines.modulate.call(context,list,OceanRenderContext.create_push_constant([p.tile_length.x,p.tile_length.y,20.,120.+time+PI*i,i]));rd.compute_list_add_barrier(list)
		var push=OceanRenderContext.create_push_constant([i])
		pipelines.fft.call(context,list,push);rd.compute_list_add_barrier(list)
		pipelines.transpose.call(context,list,push);rd.compute_list_add_barrier(list)
		pipelines.fft.call(context,list,push);rd.compute_list_add_barrier(list)
		pipelines.unpack.call(context,list,OceanRenderContext.create_push_constant([i,p.whitecap,delta*p.foam_amount*7.5,delta*max(.5,10.-p.foam_amount)*1.15]));rd.compute_list_add_barrier(list)
	for pass_callback in mip_passes:pass_callback.call(context,list);rd.compute_list_add_barrier(list)
	rd.compute_list_end();rd.capture_timestamp("CampaignOceanFFT/end")
	if copy_after:copy_previous()
	metrics.updates+=1;metrics.dispatchCpuMs=(Time.get_ticks_usec()-begin)/1000.;metrics.maxDispatchCpuMs=max(metrics.maxDispatchCpuMs,metrics.dispatchCpuMs)
func capture(time,callback):
	for key in ["normal","previous_normal"]:rd.texture_clear(descriptors[key].rid,Color(0,0,0,0),0,levels,0,layers)
	for i in 8:update_at(time-float(7-i)/24.,1./24.,i==7)
	present(1.)
	callback.call_deferred()
func present(alpha):
	if not ready or released:return
	if alpha==last_presented_alpha and metrics.updates==last_presented_update:return
	last_presented_alpha=alpha;last_presented_update=metrics.updates
	var list=rd.compute_list_begin()
	pipelines.temporal.call(context,list,OceanRenderContext.create_push_constant([float(alpha)]));rd.compute_list_add_barrier(list)
	for pass_callback in display_mip_passes:pass_callback.call(context,list);rd.compute_list_add_barrier(list)
	rd.compute_list_end()
func probe(callback):
	# Explicit validation-only readbacks. Never called by the playing scene.
	var result={"layers":[],"finite":true,"normalMipLevels":levels,"resolution":n}
	for layer in layers:
		var bytes=rd.texture_get_data(descriptors.displacement.rid,layer)
		var image=Image.create_from_data(n,n,false,Image.FORMAT_RGBAH,bytes)
		var minimum=INF;var maximum=-INF;var normal_energy=0.;var foam_max=0.
		for y in range(0,n,4):
			for x in range(0,n,4):
				var c=image.get_pixel(x,y);result.finite=result.finite and is_finite(c.r) and is_finite(c.g) and is_finite(c.b)
				minimum=min(minimum,c.g);maximum=max(maximum,c.g)
		var normal_bytes=rd.texture_get_data(descriptors.normal.rid,layer)
		var normal_image=Image.create_from_data(n,n,true,Image.FORMAT_RGBAH,normal_bytes)
		for y in range(0,n,4):
			for x in range(0,n,4):
				var c=normal_image.get_pixel(x,y);normal_energy+=c.r*c.r+c.g*c.g;foam_max=max(foam_max,c.a)
		var last=Image.create_from_data(1,1,false,Image.FORMAT_RGBAH,normal_bytes.slice(normal_bytes.size()-8)).get_pixel(0,0)
		result.layers.append({"minHeightMetres":minimum,"maxHeightMetres":maximum,"slopeEnergy":normal_energy,"foamMax":foam_max,"coarsestMoment":[last.r,last.g,last.b,last.a],"displacementSha256":bytes.hex_encode().sha256_text(),"previousMatches":normal_bytes==rd.texture_get_data(descriptors.previous_normal.rid,layer),"displayMatchesCurrent":normal_bytes==rd.texture_get_data(descriptors.display_normal.rid,layer)})
	callback.call_deferred(result)
func release():
	if released:return
	released=true;ready=false
	for wrapper in [displacement,normal,previous_displacement,previous_normal,display_normal]:wrapper.texture_rd_rid=RID()
	if context!=null:context.free();context=null
