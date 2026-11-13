extends RefCounted
## Fixed packed index. Startup can pin all source chunks for the whole world.
var manifest
var headers:PackedInt32Array
var indices:PackedInt32Array
var cells={}
var chunks={}
var order=[]
var source_pinned=false
var preloaded_bytes=0
func preload_all(tree):
	source_pinned=true
	for chunk in manifest.chunks.size():
		if not chunks.has(chunk):
			chunks[chunk]=FileAccess.get_file_as_bytes("res://data/world-coasts/"+manifest.chunks[chunk].file).to_float32_array()
			order.append(chunk)
		await tree.process_frame
	preloaded_bytes=0
	for data in chunks.values():preloaded_bytes+=data.size()*4
func _init():
	manifest=JSON.parse_string(FileAccess.get_file_as_string("res://data/world-coasts/manifest.json"))
	headers=FileAccess.get_file_as_bytes("res://data/world-coasts/cells.bin").to_int32_array()
	indices=FileAccess.get_file_as_bytes("res://data/world-coasts/indices.bin").to_int32_array()
	for row in headers.size()/4:cells[Vector2i(headers[row*4],headers[row*4+1])]=row
func ids_at(point):
	var key=Vector2i(floori(point.x),floori(point.y))
	if not cells.has(key):return PackedInt32Array()
	var row=cells[key]*4;return indices.slice(headers[row+2],headers[row+2]+headers[row+3])
func segment(id):
	var chunk=id/int(manifest.chunkSize)
	if not chunks.has(chunk):
		chunks[chunk]=FileAccess.get_file_as_bytes("res://data/world-coasts/"+manifest.chunks[chunk].file).to_float32_array()
		order.append(chunk)
		while not source_pinned and order.size()>4:chunks.erase(order.pop_front())
	else:order.erase(chunk);order.append(chunk)
	var offset=(id-int(manifest.chunks[chunk].start))*12;return chunks[chunk].slice(offset,offset+12)
func nearest(point):
	var best=.22;var result=null
	for id in ids_at(point):
		var s=segment(id);var a=Vector2(s[0],s[1]);var b=Vector2(s[2],s[3]);var tangent=b-a;var t=clamp((point-a).dot(tangent)/tangent.length_squared(),0.,1.);var delta=point-a-tangent*t;var d=delta.length()
		if d<best:best=d;result={"point":point,"coast_point":a+tangent*t,"normal":Vector2(s[4],s[5]),"distance":d*sign(delta.dot(Vector2(s[4],s[5]))),"beach":s[8],"rock":s[9]}
	return result
