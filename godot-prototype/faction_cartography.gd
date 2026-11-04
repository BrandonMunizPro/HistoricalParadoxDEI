extends RefCounted
## Initial scenario control and render adapter, separate from geography,
## architectural culture and any future campaign simulation/ownership rules.
var world
var political_ref:WeakRef
var political:
	get:return political_ref.get_ref()
var data={}
var presentation={}
var by_id={}
var control={}
var territory_indices={}
var palette_image:Image
var palette:ImageTexture
var ids:ImageTexture
var atlas:Texture2D
var layer:CanvasLayer
var panel:PanelContainer
var list:VBoxContainer
var filter:LineEdit
var detail:Label
var overlay
var placements={}
var selected=""
var enabled=true
var regions
var owner_image:Image
var owner_texture:ImageTexture
var local_identities
func _init(owner,adapter):
	world=owner;political_ref=weakref(adapter)
	enabled=not OS.get_cmdline_user_args().has("--neutral-map")
	if not enabled:return
	data=world.read_json("data/factions/scenario-278.json");assert(data.dateBce==278)
	presentation=world.read_json("data/factions/presentation.json")
	placements=world.read_json("data/factions/label-placements.json")
	for index in data.factions.size():
		var faction=data.factions[index];faction.renderIndex=index
		if presentation.factions.has(faction.id):
			faction.merge(presentation.factions[faction.id],true)
		assert(not by_id.has(faction.id));by_id[faction.id]=faction
		if placements.has(faction.id):faction.label=placements[faction.id]
	var size=1
	while size<data.territories.size()+2:size*=2
	palette_image=Image.create(size,1,false,Image.FORMAT_RGBA8)
	palette_image.set_pixel(1,0,Color(.45,.43,.45,.7))
	for i in data.territories.size():
		var territory=data.territories[i];assert(by_id.has(territory.initialController));assert(not territory_indices.has(territory.id))
		control[territory.id]=territory.initialController;territory_indices[territory.id]=i+2
		write_palette(territory)
	regions=load("res://geographic_regions.gd").new()
	assert(regions.configure(world.read_json("data/geographic-regions/definitions.json"),world.read_json("data/geographic-regions/initial-owners.json"),data.factions,world.sites))
	owner_image=Image.create(size,1,false,Image.FORMAT_RGBA8)
	for territory in data.territories:write_owner_identity(territory)
	owner_texture=ImageTexture.create_from_image(owner_image)
	palette=ImageTexture.create_from_image(palette_image)
	var image=Image.load_from_file("res://data/factions/territory-ids.png")
	ids=ImageTexture.create_from_image(image)
	assert(political.set_cartography_layers(palette,ids,Rect2(-12.,12.,87.,50.)))
	RenderingServer.global_shader_parameter_set("political_palette",palette)
	RenderingServer.global_shader_parameter_set("political_ids_mode",true)
	atlas=ImageTexture.create_from_image(load("res://assets/factions/emblems.res").get_image())
	make_overlay()
func write_palette(territory):
	var color=Color(by_id[control[territory.id]].color) if control[territory.id]!="" else Color(.30,.30,.30)
	color.a=1.
	palette_image.set_pixel(territory_indices[territory.id],0,color)
func write_owner_identity(territory):
	var owner=control[territory.id]
	var index=by_id[owner].renderIndex+2 if owner!="" else 0
	owner_image.set_pixel(territory_indices[territory.id],0,Color(float(index&255)/255.,float(index>>8)/255.,0,1))
func set_region_owner(region_id:String,faction_id:String)->bool:
	if regions==null or not regions.set_owner(region_id,faction_id):return false
	var definition=regions.definitions[region_id]
	control[definition.legacyTerritoryId]=faction_id
	var territory=data.territories[definition.rasterIndex-2]
	write_palette(territory);write_owner_identity(territory)
	palette.update(palette_image);owner_texture.update(owner_image)
	if overlay!=null:overlay.refresh_anchors()
	return true
func restore_region_state(state)->bool:
	if regions==null or not regions.restore_state(state):return false
	for id in regions.definitions:
		var definition=regions.definitions[id]
		control[definition.legacyTerritoryId]=regions.owners[id]
		var territory=data.territories[definition.rasterIndex-2]
		write_palette(territory);write_owner_identity(territory)
	palette.update(palette_image);owner_texture.update(owner_image)
	if overlay!=null:overlay.refresh_anchors()
	return true
func set_faction_color(id:String,color:Color)->bool:
	if not by_id.has(id):return false
	by_id[id].color="#"+color.to_html(false)
	for territory in data.territories:
		if control[territory.id]==id:write_palette(territory)
	palette.update(palette_image)
	if atlas!=null:
		var index=data.factions.find(by_id[id]);var icon=Image.new();icon.load_svg_from_string(load("res://faction_emblems.gd").svg(by_id[id],index))
		var image=atlas.get_image();image.clear_mipmaps();image.blit_rect(icon,Rect2i(0,0,64,64),Vector2i((index%16)*64,(index/16)*64));image.generate_mipmaps();(atlas as ImageTexture).update(image)
	return true
func set_region_controller(territory_id:String,faction_id:String)->bool:
	if regions==null or not regions.legacy_ids.has(territory_id):return false
	return set_region_owner(regions.legacy_ids[territory_id],faction_id)
func label_for(id):
	var faction=by_id[id]
	if faction.status=="presence_only":return Vector2(faction.label[0],faction.label[1])
	var result=null;var best=INF;var preferred=Vector2(faction.label[0],faction.label[1])
	for territory in data.territories:
		if control[territory.id]!=id or not placements.has(territory.initialController):continue
		var point=placements[territory.initialController];var p=Vector2(point[0],point[1]);var distance=p.distance_squared_to(preferred)
		if distance<best:best=distance;result=p
	return result
func focus_faction(id):
	var faction=by_id[id];selected=id
	world.goal_focus=Vector2(faction.label[0],faction.label[1]);world.goal_distance=clamp(faction.viewDistanceKm,180.,5000.)
	detail.text=faction.name+" · "+faction.status.replace("_"," ")+"\n"+faction.notes+"\n\nEmblem: "+faction.emblem.basis.replace("_"," ")+". "+faction.emblem.note
func make_overlay():
	layer=CanvasLayer.new();layer.name="FactionCartography";layer.layer=2;world.add_child(layer)
	overlay=load("res://faction_overlay.gd").new();overlay.cartography=self;overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);overlay.mouse_filter=Control.MOUSE_FILTER_IGNORE;layer.add_child(overlay)
	var box=VBoxContainer.new();layer.add_child(box);box.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT);box.offset_left=-300;box.offset_right=-20;box.offset_top=20;box.offset_bottom=20;box.custom_minimum_size=Vector2(280,0)
	var toggle=Button.new();toggle.text="Factions · "+str(data.factions.size());toggle.pressed.connect(func():panel.visible=not panel.visible);box.add_child(toggle)
	panel=PanelContainer.new();panel.visible=false;box.add_child(panel)
	var column=VBoxContainer.new();panel.add_child(column)
	var notice=Label.new();notice.text="278 BCE · scenario reconstruction";notice.add_theme_font_size_override("font_size",13);column.add_child(notice)
	filter=LineEdit.new();filter.placeholder_text="Find faction or culture…";filter.text_changed.connect(populate_list);column.add_child(filter)
	var scroll=ScrollContainer.new();scroll.custom_minimum_size=Vector2(280,340);column.add_child(scroll)
	list=VBoxContainer.new();list.size_flags_horizontal=Control.SIZE_EXPAND_FILL;scroll.add_child(list)
	detail=Label.new();detail.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;detail.custom_minimum_size=Vector2(270,0);detail.text="All faction borders are outlined.\nRegions remain reconstructed / provisional.\nSelect a faction for emblem evidence.";detail.add_theme_font_size_override("font_size",12);column.add_child(detail)
	populate_list("")
func populate_list(query):
	for child in list.get_children():child.queue_free()
	var rows=data.factions.duplicate();rows.sort_custom(func(a,b):return a.name<b.name)
	for faction in rows:
		var family=""
		for culture in data.cultures:
			if culture.id==faction.culture:family=culture.family
		var search=(faction.name+" "+faction.culture+" "+family+" "+" ".join(faction.aliases)).to_lower()
		if query!="" and not query.to_lower() in search:continue
		var button=Button.new();button.text=faction.name;button.alignment=HORIZONTAL_ALIGNMENT_LEFT;button.add_theme_color_override("font_color",Color("eee1bf"));button.tooltip_text=faction.status+"\n"+faction.notes+"\nEmblem: "+faction.emblem.basis.replace("_"," ")+"\n"+faction.emblem.note;button.pressed.connect(focus_faction.bind(faction.id))
		var icon=AtlasTexture.new();icon.atlas=atlas;var index=faction.renderIndex;icon.region=Rect2((index%16)*64,(index/16)*64,64,64);button.icon=icon;button.expand_icon=true;button.add_theme_constant_override("icon_max_width",28);list.add_child(button)
	if local_identities!=null:
		var heading=Label.new();heading.text="Regional administrations / local polities";heading.add_theme_font_size_override("font_size",12);list.add_child(heading)
		for r in local_identities.records:
			if r.get("factionId")!=null:continue
			if query!="" and not query.to_lower() in (r.name+" "+r.kind+" "+r.notes).to_lower():continue
			var button=Button.new();button.text=r.name.capitalize();button.alignment=HORIZONTAL_ALIGNMENT_LEFT;button.tooltip_text=local_identities.subtitle(r)+"\n"+r.confidence+"\n"+r.notes;button.pressed.connect(local_identities.focus_identity.bind(r.id));list.add_child(button)
func update():
	if enabled and layer!=null:
		layer.visible=political.blend>.01
		if political.blend>=1. and world.distance>=600.:
			for marker in world.markers:
				if marker.site.key!=world.selected:marker.label.visible=false
