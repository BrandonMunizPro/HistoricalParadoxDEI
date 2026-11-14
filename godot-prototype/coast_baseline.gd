extends RefCounted
## Persistent source-exact baseline, extending the existing coast renderer.
## Shared strip geometry + source instancing; no detailed world meshes retained.
var world
var owner
var ready=false
var failed=false
var manifest={}
var textures={}
var nodes=[]
var detail_enabled=false
var material
var metrics={"segments":0,"instances":0,"chunks":0,"textureBytes":0,"instanceBytes":0,"preparationMs":0}
const ROOT="res://data/world-coast-baseline/"
func _init(host,coast):world=host;owner=coast
func texture_bytes(spec,key):
	if not spec.has("parts"):return FileAccess.get_file_as_bytes(ROOT+key+".bin")
	var bytes=PackedByteArray()
	for part in spec.parts:
		var data=FileAccess.get_file_as_bytes(ROOT+part.file)
		if data.size()!=int(part.bytes):return PackedByteArray()
		bytes.append_array(data)
	return bytes
func bind(mat):
	if not ready:return
	for key in textures:mat.set_shader_parameter("coast_baseline_"+key,textures[key])
	mat.set_shader_parameter("coast_baseline_page_origin",Vector2(manifest.pageOrigin[0],manifest.pageOrigin[1]))
	mat.set_shader_parameter("coast_baseline_enabled",detail_enabled)
func strip():
	var vertices=PackedVector3Array();var uv=PackedVector2Array();var indices=PackedInt32Array()
	for t in [0.,1.]:
		for d in [-.18,0.,.25,1.,1.2]:vertices.append(Vector3(t,0,d));uv.append(Vector2(t,d))
	for i in 4:indices.append_array(PackedInt32Array([i,i+1,i+5,i+1,i+6,i+5]))
	var arrays=[];arrays.resize(Mesh.ARRAY_MAX);arrays[Mesh.ARRAY_VERTEX]=vertices;arrays[Mesh.ARRAY_TEX_UV]=uv;arrays[Mesh.ARRAY_INDEX]=indices
	var mesh=ArrayMesh.new();mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays);return mesh
func prepare(tree):
	if ready or failed:return
	var start=Time.get_ticks_msec()
	if not FileAccess.file_exists(ROOT+"manifest.json"):
		failed=true;push_error("Missing derived worldwide coast baseline; run tools/world-coast-baseline-build.mjs");return
	manifest=JSON.parse_string(FileAccess.get_file_as_string(ROOT+"manifest.json"))
	if int(manifest.get("version",0))!=3:
		failed=true;push_error("Unsupported coast baseline layout; rebuild derived buffers");return
	if manifest.sourceSha256!=owner.catalog.manifest.segmentsSha256:
		failed=true;push_error("Stale worldwide coast baseline source signature");return
	for key in manifest.textures:
		var spec=manifest.textures[key];var bytes=texture_bytes(spec,key)
		if bytes.size()!=int(spec.bytes):failed=true;push_error("Incomplete coast baseline texture: "+key);return
		var format=Image.FORMAT_RGBAF if int(spec.channels)==4 else (Image.FORMAT_RGF if int(spec.channels)==2 else Image.FORMAT_RF)
		textures[key]=ImageTexture.create_from_image(Image.create_from_data(int(spec.width),int(spec.height),false,format,bytes))
		await tree.process_frame
	var shader=Shader.new();var code=owner.beach.material_override.shader.code
	code=code.replace("render_mode world_vertex_coords,cull_disabled;","render_mode skip_vertex_transform,cull_disabled;")
	code=code.replace("void vertex(){point=VERTEX;shore=UV.y;beach_normal=NORMAL;style=COLOR.rg;}","""
void vertex(){
 vec4 ends=vec4(MODEL_MATRIX[0].x,MODEL_MATRIX[1].x,MODEL_MATRIX[2].x,MODEL_MATRIX[3].x);
 vec4 basis=vec4(MODEL_MATRIX[0].y,MODEL_MATRIX[1].y,MODEL_MATRIX[2].y,MODEL_MATRIX[3].y);
 style=mix(INSTANCE_CUSTOM.rg,INSTANCE_CUSTOM.ba,UV.x);
 float cut=mix(.008,.10,style.x),t=UV.x;
 float d=UV.y<0.?UV.y:(UV.y<=1.?UV.y*cut:cut+.020);
 vec2 offset=mix(COLOR.rg*4.-2.,COLOR.ba*4.-2.,t);
 vec2 p=mix(ends.xy,ends.zw,t)+offset*d;
 float join=mix(MODEL_MATRIX[2].z,MODEL_MATRIX[3].z,t);
 float h=d<=0.?d*mix(.7,.08,style.x):mix(d*.055,join,smoothstep(cut*.25,cut,d));
 point=vec3(p.x,h,p.y);shore=d;
 beach_normal=normalize(vec3(-basis.x*join/max(.008,cut),1.,-basis.y*join/max(.008,cut)));
 UV=vec2(basis.z+t*basis.w,d);VERTEX=(VIEW_MATRIX*vec4(point,1.)).xyz;
}
""")
	code=code.replace("void fragment(){","void fragment(){\n if(focus_coast_local_weight(point.xz)>.999)discard;")
	code=code.replace("if(focus_coast_streamed){","if(true){")
	shader.code=code
	var mat=owner.beach.material_override.duplicate();mat.shader=shader
	material=mat
	owner.bind(mat)
	var mesh=strip();var batch=0
	for chunk in manifest.chunks:
		var bytes=FileAccess.get_file_as_bytes(ROOT+chunk.file)
		if bytes.size()!=int(chunk.count)*80:failed=true;push_error("Incomplete coast baseline instances: "+chunk.file);return
		var mm=MultiMesh.new();mm.transform_format=MultiMesh.TRANSFORM_3D;mm.use_colors=true;mm.use_custom_data=true;mm.mesh=mesh;mm.instance_count=int(chunk.count);mm.buffer=bytes.to_float32_array()
		var b=chunk.bounds;mm.custom_aabb=AABB(Vector3(b[0]-.25,-.2,b[1]-.25),Vector3(b[2]-b[0]+.5,manifest.maximumHeight+.4,b[3]-b[1]+.5))
		var node=MultiMeshInstance3D.new();node.name="PersistentSourceCoast";node.multimesh=mm;node.material_override=mat;node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		node.visible=false;world.add_child(node);nodes.append(node)
		metrics.instances+=int(chunk.count);batch+=1
		if batch%12==0:await tree.process_frame
	ready=metrics.instances==int(manifest.segments)
	metrics.segments=int(manifest.segments);metrics.chunks=nodes.size();metrics.textureBytes=int(manifest.textureBytes);metrics.instanceBytes=int(manifest.instanceBytes);metrics.preparationMs=Time.get_ticks_msec()-start
	for entry in owner.materials:
		var material=entry.get_ref()
		if material!=null:bind(material)
	tick();print("WORLD_COAST_BASELINE_READY ",JSON.stringify(metrics))
func warmup_node(centre):
	var mm=MultiMesh.new();mm.transform_format=MultiMesh.TRANSFORM_3D;mm.use_colors=true;mm.use_custom_data=true;mm.mesh=strip();mm.instance_count=1
	mm.buffer=PackedFloat32Array([centre.x,centre.z,centre.x+.1,centre.z,0.,1.,0.,.1,1.,0.,centre.y,centre.y,.5,.75,.5,.75,1.,0.,1.,0.])
	mm.custom_aabb=AABB(centre-Vector3.ONE,Vector3.ONE*2.)
	var node=MultiMeshInstance3D.new();node.multimesh=mm;node.material_override=material;node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return node
func tick():
	var wanted=ready and world.distance<190.
	if wanted==detail_enabled:return
	detail_enabled=wanted
	for node in nodes:node.visible=wanted
	for entry in owner.materials:
		var mat=entry.get_ref()
		if mat!=null:mat.set_shader_parameter("coast_baseline_enabled",wanted)
