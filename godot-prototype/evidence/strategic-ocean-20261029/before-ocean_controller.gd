extends Node
## Campaign adapter: keeps geographic masks and km-world units outside the FFT.
var world
var background:MeshInstance3D
var patch:MeshInstance3D
var materials=[]
var settings={}
var quality={}
var fft
var gpu_ready=false
var capture_frozen=false
var capture_complete=false
var accumulator=0.
var period=1./24.
var normal_mode=""
var metrics={"mode":"FFT","ready":false,"computeUpdates":0,"simulationHz":0.,"seaSprayParticles":0,"dispatch":{}}
func setup(owner,water,material):
	world=owner;background=water;materials=[material]
	settings=world.read_json("data/ocean-settings.json")
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--ocean-quality="):settings.quality=arg.trim_prefix("--ocean-quality=")
		if arg.begins_with("--ocean-wind="):settings.wind_direction_degrees=float(arg.trim_prefix("--ocean-wind="))
	assert(settings.presets.has(settings.quality),"Unknown ocean quality preset")
	quality=settings.presets[settings.quality]
	assert(int(quality.resolution) in [128,256,512] and int(quality.cascades)>=1 and int(quality.cascades)<=3)
	assert(settings.maximum_displacement_metres>=0. and settings.maximum_displacement_metres<1.)
	material.shader=load("res://ocean/ocean_surface.gdshader")
	patch=MeshInstance3D.new();patch.name="ContinuousOceanWavePatch";patch.mesh=grid(int(quality.grid));patch.custom_aabb=AABB(Vector3(-1,-.01,-1),Vector3(2,.02,2))
	patch.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var patch_mat=material.duplicate();patch_mat.set_shader_parameter("render_patch",true);patch.material_override=patch_mat
	materials.append(patch_mat);world.add_child(patch)
	var scales=PackedVector4Array()
	for i in int(quality.cascades):
		var c=settings.cascades[i];scales.append(Vector4(1./c.tile_metres,1./c.tile_metres,c.displacement,c.normal))
	while scales.size()<3:scales.append(Vector4.ZERO)
	for mat in materials:
		mat.set_shader_parameter("cascade_scales",scales);mat.set_shader_parameter("cascade_count",int(quality.cascades))
		for key in ["wave_intensity","maximum_displacement_metres","foam_strength","shore_foam_strength","roughness","coastal_band_km"]:mat.set_shader_parameter(key,settings[key])
		for key in ["deep_color","coastal_color"]:mat.set_shader_parameter(key,Vector3(settings[key][0],settings[key][1],settings[key][2]))
	fft=preload("res://ocean/fft.gd").new()
	RenderingServer.call_on_render_thread(fft.initialize.bind(settings.duplicate(true),quality.duplicate(true),Callable(self,"on_gpu_ready")))
	metrics["quality"]=settings.quality;metrics["resolution"]=quality.resolution;metrics["cascades"]=quality.cascades;metrics["patchVertices"]=int(quality.grid)*int(quality.grid)
func grid(count):
	var vertices=PackedVector3Array();var normals=PackedVector3Array();var indices=PackedInt32Array()
	for z in count:
		for x in count:
			var u=float(x)/(count-1)*2.-1.;var v=float(z)/(count-1)*2.-1.
			u=sign(u)*(exp(abs(u)*4.)-1.)/(exp(4.)-1.);v=sign(v)*(exp(abs(v)*4.)-1.)/(exp(4.)-1.)
			vertices.append(Vector3(u,0,v));normals.append(Vector3.UP)
	for z in count-1:
		for x in count-1:
			var a=z*count+x;indices.append_array(PackedInt32Array([a,a+1,a+count,a+1,a+count+1,a+count]))
	var arrays=[];arrays.resize(Mesh.ARRAY_MAX);arrays[Mesh.ARRAY_VERTEX]=vertices;arrays[Mesh.ARRAY_NORMAL]=normals;arrays[Mesh.ARRAY_INDEX]=indices
	var mesh=ArrayMesh.new();mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays);return mesh
func on_gpu_ready(success):
	gpu_ready=success;metrics.ready=success
	if not success:push_error("Ocean RenderingDevice unavailable");return
	for mat in materials:
		mat.set_shader_parameter("fft_displacement",fft.displacement);mat.set_shader_parameter("fft_normal",fft.display_normal)
		mat.set_shader_parameter("fft_previous_displacement",fft.previous_displacement);mat.set_shader_parameter("fft_previous_normal",fft.previous_normal)
		mat.set_shader_parameter("fft_ready",true)
	print("CAMPAIGN_OCEAN_READY ",settings.quality," resolution=",quality.resolution," cascades=",quality.cascades)
func _process(delta):
	if not gpu_ready:return
	var direction=-world.camera.global_basis.z
	var center=world.camera.global_position
	if direction.y<-.001:center+=direction*(-center.y/direction.y)
	else:center=world.target
	var radius=clamp(world.distance*.85,.35,6.)
	center.x=snapped(center.x,.0005);center.z=snapped(center.z,.0005);center.y=0.
	patch.position=center;patch.scale=Vector3(radius,1,radius);patch.visible=world.distance<10.
	for mat in materials:
		mat.set_shader_parameter("patch_center",Vector2(center.x,center.z));mat.set_shader_parameter("patch_radius",radius)
		mat.set_shader_parameter("patch_active",patch.visible);mat.set_shader_parameter("camera_distance",world.distance)
	var hz=float(quality.near_hz if world.distance<8. else (quality.regional_hz if world.distance<150. else quality.far_hz))
	period=1./hz;metrics.simulationHz=hz
	if not capture_frozen and world.water_animation_enabled:
		accumulator+=delta
		if accumulator>=period:
			var elapsed=accumulator;accumulator=fmod(accumulator,period)
			RenderingServer.call_on_render_thread(fft.update_at.bind(world.water_time,min(elapsed,.25)))
			metrics.computeUpdates+=1
	var alpha=1. if capture_frozen or not world.water_animation_enabled else clamp(accumulator/period,0.,1.)
	for mat in materials:mat.set_shader_parameter("temporal_blend",alpha)
	# Resolve close-view normals once per texel. At intermediate zoom interpolate
	# the filtered histories directly; far views use the phase-insensitive moments.
	var mode="resolved" if world.distance<1. else ("histories" if world.distance<8. else "far")
	if mode!=normal_mode:
		normal_mode=mode
		for mat in materials:
			mat.set_shader_parameter("fft_normal",fft.display_normal if mode=="resolved" else fft.normal)
			mat.set_shader_parameter("normals_resolved",mode!="histories")
		metrics["normalMode"]=mode
	if mode=="resolved":RenderingServer.call_on_render_thread(fft.present.bind(alpha))
func capture_time(time):
	while not gpu_ready:await get_tree().process_frame
	capture_frozen=true;capture_complete=false
	RenderingServer.call_on_render_thread(fft.capture.bind(time,Callable(self,"on_capture_complete")))
	while not capture_complete:await get_tree().process_frame
func on_capture_complete():
	capture_complete=true;metrics.dispatch=fft.metrics.duplicate(true)
	for mat in materials:mat.set_shader_parameter("temporal_blend",1.)
func resume_animation():capture_frozen=false;accumulator=period
func _exit_tree():
	if fft!=null:RenderingServer.call_on_render_thread(fft.release)
	if is_instance_valid(patch):patch.queue_free()
