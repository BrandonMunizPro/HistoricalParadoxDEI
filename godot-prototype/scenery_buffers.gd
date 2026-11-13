extends RefCounted
## Pure worker data preparation. Inputs are exclusively owned placement arrays;
## no scene objects, meshes, images, or rendering APIs are touched here.
static func pack(batches,colours,customs):
	var buffers=[]
	for species in batches.size():
		var buffer=PackedFloat32Array()
		buffer.resize(batches[species].size()*20)
		for i in batches[species].size():
			var t:Transform3D=batches[species][i]
			var c:Color=colours[species][i];var d:Color=customs[species][i]
			var values=[t.basis.x.x,t.basis.y.x,t.basis.z.x,t.origin.x,
				t.basis.x.y,t.basis.y.y,t.basis.z.y,t.origin.y,
				t.basis.x.z,t.basis.y.z,t.basis.z.z,t.origin.z,
				c.r,c.g,c.b,c.a,d.r,d.g,d.b,d.a]
			for j in 20:buffer[i*20+j]=values[j]
		buffers.append(buffer)
	return buffers
