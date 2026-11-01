extends SceneTree
func _initialize():call_deferred("run")
func run():
	for kind in ["grass","soil","rock"]:
		for channel in ["color","normal","roughness"]:
			var path="res://assets/landscape-quality/"+kind+"-"+channel+".jpg" if kind!="soil" else "res://assets/settlement-identities/soil-"+channel+".jpg"
			var image=load(path).get_image()
			if image.is_compressed():assert(image.decompress()==OK)
			assert(image.generate_mipmaps(channel=="normal")==OK)
			# BC5 stores the two independent normal channels. The shader reconstructs Z.
			if channel=="normal":image.convert(Image.FORMAT_RG8)
			assert(image.compress_from_channels(Image.COMPRESS_S3TC,Image.USED_CHANNELS_RG)==OK if channel=="normal" else image.compress(Image.COMPRESS_S3TC)==OK)
			var texture=ImageTexture.create_from_image(image)
			assert(ResourceSaver.save(texture,"res://assets/landscape-quality/"+kind+"-"+channel+".res")==OK)
			print("LANDSCAPE_TEXTURE ",kind," ",channel," ",image.get_width()," mips=",image.get_mipmap_count()," compressed=",image.is_compressed())
	var control=load("res://assets/landscape-quality/control.png").get_image()
	if control.is_compressed():assert(control.decompress()==OK)
	assert(control.generate_mipmaps()==OK)
	assert(ResourceSaver.save(ImageTexture.create_from_image(control),"res://assets/landscape-quality/control.res")==OK)
	var ripple=load("res://data/visual/water-ripples.png").get_image()
	if ripple.is_compressed():assert(ripple.decompress()==OK)
	assert(ripple.generate_mipmaps(true)==OK)
	assert(ResourceSaver.save(ImageTexture.create_from_image(ripple),"res://assets/landscape-quality/ripple.res")==OK)
	var meso=load("res://assets/roma-showcase/ground-color.jpg").get_image()
	if meso.is_compressed():assert(meso.decompress()==OK)
	assert(meso.generate_mipmaps()==OK)
	assert(meso.compress(Image.COMPRESS_S3TC)==OK)
	assert(ResourceSaver.save(ImageTexture.create_from_image(meso),"res://assets/landscape-quality/meso.res")==OK)
	var owner=load("res://world.gd").new()
	var descriptor=JSON.parse_string(FileAccess.get_file_as_string("res://data/landscape-quality/aricia.json"))
	var parent="res://data/regional/aricia-landscape.parent"
	var mesh=owner.mesh_from_file(descriptor.mesh,parent)
	assert(ResourceSaver.save(mesh,"res://data/landscape-quality/aricia.res")==OK)
	var entry={"path":"res://data/landscape-quality/aricia.res","hash":owner.mesh_fingerprint(descriptor.mesh,parent)}
	FileAccess.open("res://data/landscape-quality/native.json",FileAccess.WRITE).store_string(JSON.stringify(entry,"  "))
	owner.free()
	quit()
