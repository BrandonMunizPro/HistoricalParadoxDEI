extends RefCounted
## Main-device compute, two reusable fields, no GPU readback during play.
var rd
var shader:RID
var pipeline:RID
var fields=[]
var textures=[]
var transient=[]
var slot=0
var size=1024
func initialize():
	rd=RenderingServer.get_rendering_device()
	if rd==null:return false
	var source=RDShaderSource.new();source.source_compute=FileAccess.get_file_as_string("res://ocean/coast_field.glsl").replace("#[compute]","")
	var spirv=rd.shader_compile_spirv_from_source(source)
	if spirv.get_stage_compile_error(RenderingDevice.SHADER_STAGE_COMPUTE)!="":push_error(spirv.get_stage_compile_error(RenderingDevice.SHADER_STAGE_COMPUTE));return false
	shader=rd.shader_create_from_spirv(spirv);pipeline=rd.compute_pipeline_create(shader)
	for i in 2:
		var format=RDTextureFormat.new();format.width=size;format.height=size;format.format=RenderingDevice.DATA_FORMAT_R32G32B32A32_SFLOAT;format.usage_bits=RenderingDevice.TEXTURE_USAGE_STORAGE_BIT|RenderingDevice.TEXTURE_USAGE_SAMPLING_BIT|RenderingDevice.TEXTURE_USAGE_CAN_COPY_FROM_BIT
		var rid=rd.texture_create(format,RDTextureView.new());fields.append(rid)
		var texture=Texture2DRD.new();texture.texture_rd_rid=rid;textures.append(texture)
	return true
func bake(data:PackedFloat32Array,bins:PackedInt32Array,bounds:Vector4,callback):
	if rd==null and not initialize():callback.call_deferred(null);return
	for rid in transient:rd.free_rid(rid)
	transient.clear();slot=1-slot
	var bytes=data.to_byte_array();var segment_buffer=rd.storage_buffer_create(bytes.size(),bytes);var index_bytes=bins.to_byte_array();var index_buffer=rd.storage_buffer_create(index_bytes.size(),index_bytes)
	var uniforms=[]
	for entry in [[RenderingDevice.UNIFORM_TYPE_IMAGE,fields[slot]],[RenderingDevice.UNIFORM_TYPE_STORAGE_BUFFER,segment_buffer],[RenderingDevice.UNIFORM_TYPE_STORAGE_BUFFER,index_buffer]]:
		var uniform=RDUniform.new();uniform.uniform_type=entry[0];uniform.binding=uniforms.size();uniform.add_id(entry[1]);uniforms.append(uniform)
	var set=rd.uniform_set_create(uniforms,shader,0);transient.assign([set,index_buffer,segment_buffer])
	var constants=PackedFloat32Array([bounds.x,bounds.y,bounds.z,bounds.w]).to_byte_array();constants.append_array(PackedInt32Array([size,size,0,0]).to_byte_array())
	var list=rd.compute_list_begin();rd.compute_list_bind_compute_pipeline(list,pipeline);rd.compute_list_bind_uniform_set(list,set,0);rd.compute_list_set_push_constant(list,constants,constants.size());rd.compute_list_dispatch(list,size/8,size/8,1);rd.compute_list_end()
	callback.call_deferred(textures[slot])
func release():
	if rd==null:return
	for texture in textures:texture.texture_rd_rid=RID()
	for rid in transient:rd.free_rid(rid)
	for rid in fields:rd.free_rid(rid)
	if pipeline.is_valid():rd.free_rid(pipeline)
	if shader.is_valid():rd.free_rid(shader)
	transient.clear();fields.clear();textures.clear();rd=null
func validation_readback(callback):
	# Validation tools only; never called by normal shoreline streaming.
	var bytes=rd.texture_get_data(fields[slot],0)
	callback.call_deferred(bytes.to_float32_array())
