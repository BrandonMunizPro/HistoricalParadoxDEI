extends SceneTree
func _initialize():
	var folder="res://assets/vegetation-quality/"
	for key in ["oak","ash","pine","bark-Color","bark-NormalGL","bark-Roughness"]:
		var extension="jpg" if key.begins_with("bark") else "png"
		var source=Image.load_from_file(folder+key+"."+extension);source.generate_mipmaps(key=="bark-NormalGL")
		assert(ResourceSaver.save(ImageTexture.create_from_image(source),folder+key+".res",ResourceSaver.FLAG_COMPRESS)==OK)
	var entries=[]
	if FileAccess.file_exists(folder+"impostors.json"):entries=JSON.parse_string(FileAccess.get_file_as_string(folder+"impostors.json"))
	for entry in entries:
		var file=folder+entry.name+"-atlas"
		var image=Image.load_from_file(file+".png")
		image.fix_alpha_edges();image.generate_mipmaps()
		var texture=ImageTexture.create_from_image(image)
		assert(ResourceSaver.save(texture,file+".res",ResourceSaver.FLAG_COMPRESS)==OK)
		var restored=load(file+".res")
		assert(restored.get_image().get_data()==image.get_data())
	print("VEGETATION_TEXTURES_BAKED source_maps=6 bit_identical_atlas_mip_chains=",entries.size())
	quit()
