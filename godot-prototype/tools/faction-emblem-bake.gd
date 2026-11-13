extends SceneTree
func fit_icon(path:String,size:int)->Image:
	var source=Image.load_from_file(path)
	assert(source!=null)
	source.convert(Image.FORMAT_RGBA8)
	var scale=min(float(size)/source.get_width(),float(size)/source.get_height())
	var width=max(1,roundi(source.get_width()*scale));var height=max(1,roundi(source.get_height()*scale))
	source.resize(width,height,Image.INTERPOLATE_LANCZOS)
	var icon=Image.create(size,size,false,Image.FORMAT_RGBA8);icon.fill(Color(0,0,0,0))
	icon.blit_rect(source,Rect2i(0,0,width,height),Vector2i((size-width)/2,(size-height)/2))
	return icon
func _initialize():
	var scenario_path="res://data/world-border-review/scenario-278.json" if FileAccess.file_exists("res://data/world-border-review/scenario-278.json") else "res://data/factions/scenario-278.json"
	var data=JSON.parse_string(FileAccess.get_file_as_string(scenario_path))
	var presentation=JSON.parse_string(FileAccess.get_file_as_string("res://data/factions/presentation.json"))
	var folder="res://assets/factions/";DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(folder));FileAccess.open(folder+".gdignore",FileAccess.WRITE).store_string("")
	var image=Image.create(1024,ceili(data.factions.size()/16.)*64,false,Image.FORMAT_RGBA8)
	var raster=0;var vector=0
	for i in data.factions.size():
		data.factions[i].merge(presentation.factions[data.factions[i].id],true)
		var svg=load("res://faction_emblems.gd").svg(data.factions[i],i)
		FileAccess.open(folder+data.factions[i].id+".svg",FileAccess.WRITE).store_string(svg)
		var icon=null
		var raster_path=folder+"icons/"+data.factions[i].id+".png"
		if FileAccess.file_exists(raster_path):
			icon=fit_icon(raster_path,64);raster+=1
		else:
			icon=Image.new();assert(icon.load_svg_from_string(svg)==OK);vector+=1
		image.blit_rect(icon,Rect2i(0,0,64,64),Vector2i((i%16)*64,(i/16)*64))
	assert(image.save_png(folder+"emblems.png")==OK);image.generate_mipmaps()
	assert(ResourceSaver.save(ImageTexture.create_from_image(image),folder+"emblems.res",ResourceSaver.FLAG_COMPRESS)==OK)
	print("FACTION_EMBLEMS_BAKED ",data.factions.size()," emblems (",raster," raster, ",vector," vector)")
	quit()
