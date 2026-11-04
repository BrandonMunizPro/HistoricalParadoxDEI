extends SceneTree
## Small resource validation, without loading the full campaign map.
func _initialize():call_deferred("run")
func run():
	var rows=[];var textures={}
	for variant in 3:
		for far in [false,true]:
			var path="res://assets/neapolis-free/house-%d%s.res"%[variant,"-far" if far else ""]
			var mesh=load(path);assert(mesh is ArrayMesh)
			var triangles=0;var degenerate=0
			for surface in mesh.get_surface_count():
				var a=mesh.surface_get_arrays(surface);var vertices=a[Mesh.ARRAY_VERTEX];var indices=a[Mesh.ARRAY_INDEX]
				assert(indices.size()%3==0)
				triangles+=indices.size()/3
				for i in range(0,indices.size(),3):
					var p=vertices[indices[i]];var q=vertices[indices[i+1]];var r=vertices[indices[i+2]]
					assert(p.is_finite() and q.is_finite() and r.is_finite())
					if (q-p).cross(r-p).length_squared()<1e-22:degenerate+=1
				var material=mesh.surface_get_material(surface)
				for texture in [material.albedo_texture,material.normal_texture,material.roughness_texture]:
					if texture==null or textures.has(texture.resource_path):continue
					var data=texture.get_image()
					textures[texture.resource_path]={"width":texture.get_width(),"height":texture.get_height(),"format":data.get_format(),"mipmaps":data.has_mipmaps(),"imageDataBytes":data.get_data_size()}
			assert(degenerate==0,"Degenerate assembly triangles")
			assert(mesh.get_aabb().size.x<.023 and mesh.get_aabb().size.z<.023 and mesh.get_aabb().size.y<.008,"Incorrect kilometre scale")
			rows.append({"path":path,"triangles":triangles,"surfaces":mesh.get_surface_count(),"degenerate":degenerate})
	var total=0
	for texture in textures.values():total+=texture.imageDataBytes
	var report={"passed":true,"meshes":rows,"sharedTextures":textures,"textureImageDataBytes":total,"notice":"CPU-side imported image data size, not independent VRAM allocation. All referenced maps already belong to the Roma material library."}
	FileAccess.open("res://evidence/neapolis-free/asset-verification.json",FileAccess.WRITE).store_string(JSON.stringify(report,"  "))
	print("NEAPOLIS_FREE_ASSET_OK ",JSON.stringify(report))
	quit()
