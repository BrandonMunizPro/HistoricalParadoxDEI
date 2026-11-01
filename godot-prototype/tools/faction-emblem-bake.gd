extends SceneTree
func _initialize():
	var data=JSON.parse_string(FileAccess.get_file_as_string("res://data/factions/scenario-278.json"))
	var presentation=JSON.parse_string(FileAccess.get_file_as_string("res://data/factions/presentation.json"))
	var folder="res://assets/factions/";DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(folder));FileAccess.open(folder+".gdignore",FileAccess.WRITE).store_string("")
	var image=Image.create(1024,ceili(data.factions.size()/16.)*64,false,Image.FORMAT_RGBA8)
	for i in data.factions.size():
		data.factions[i].merge(presentation.factions[data.factions[i].id],true)
		var svg=load("res://faction_emblems.gd").svg(data.factions[i],i)
		FileAccess.open(folder+data.factions[i].id+".svg",FileAccess.WRITE).store_string(svg)
		var icon=Image.new();assert(icon.load_svg_from_string(svg)==OK)
		image.blit_rect(icon,Rect2i(0,0,64,64),Vector2i((i%16)*64,(i/16)*64))
	assert(image.save_png(folder+"emblems.png")==OK);image.generate_mipmaps()
	assert(ResourceSaver.save(ImageTexture.create_from_image(image),folder+"emblems.res",ResourceSaver.FLAG_COMPRESS)==OK)
	print("FACTION_EMBLEMS_BAKED ",data.factions.size()," original emblems")
	quit()
