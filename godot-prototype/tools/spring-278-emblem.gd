extends SceneTree
## Append one original device without changing any existing faction's artwork.
func _initialize():
	var baseline="res://data/spring-278/baseline/"
	var image=load(baseline+"assets/factions/emblems.res").get_image()
	image.clear_mipmaps()
	var before=image.duplicate()
	var data=JSON.parse_string(FileAccess.get_file_as_string("res://data/world-border-review/scenario-278.json"))
	var presentation=JSON.parse_string(FileAccess.get_file_as_string("res://data/factions/presentation.json"))
	assert(data.factions.size()==132 and data.factions[131].id=="mamertines")
	var faction=data.factions[131].duplicate(true)
	faction.merge(presentation.factions.mamertines,true)
	var svg=load("res://faction_emblems.gd").svg(faction,131)
	var icon=Image.new();assert(icon.load_svg_from_string(svg)==OK)
	image.blit_rect(icon,Rect2i(0,0,64,64),Vector2i(192,512))
	for i in 131:
		var rect=Rect2i((i%16)*64,(i/16)*64,64,64)
		assert(before.get_region(rect).get_data()==image.get_region(rect).get_data())
	FileAccess.open("res://assets/factions/mamertines.svg",FileAccess.WRITE).store_string(svg)
	assert(image.save_png("res://assets/factions/emblems.png")==OK)
	image.generate_mipmaps()
	assert(ResourceSaver.save(ImageTexture.create_from_image(image),"res://assets/factions/emblems.res",ResourceSaver.FLAG_COMPRESS)==OK)
	print("SPRING_EMBLEM_PASS: appended Mamertines; all 131 original cells unchanged")
	quit()
