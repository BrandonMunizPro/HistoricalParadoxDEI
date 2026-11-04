extends Control
var world
var font=ThemeDB.fallback_font
var occupied=[]
var anatolia_names=["Pergamon","Sardis","Ephesus","Miletus","Priene","Magnesia on the Maeander","Smyrna","Phocaea","Cyme","Assos","Ilion","Cyzicus","Lampsacus","Chalcedon","Heraclea Pontica","Sinope","Halicarnassus","Knidos","Iasos","Mylasa","Kaunos","Alinda","Labraunda","Xanthos","Patara","Myra","Phaselis","Telmessos","Side","Perge","Aspendos","Sillyon","Nikaia","Kios","Bithynion","Apollonia on the Rhyndacus","Amisos","Kerasos","Trapezos","Kotyora","Amaseia","Tios","Gordion","Pessinus","Kelainai","Dorylaion","Kotyaion","Ancyra","Tavium","Gangra","Mazaka","Tyana","Tarsos","Soli","Anazarbos","Issos","Melitene"]
var anatolia_major=["Pergamon","Sardis","Ephesus","Miletus","Smyrna","Cyzicus","Chalcedon","Sinope","Amisos","Trapezos","Ancyra","Mazaka","Tarsos","Melitene"]
var research_labels=[]
var last_draw_ms=0.
var draw_heights={}
func _ready():
	# Curate once. Rebuilding these lists for all 687 records every draw was costly.
	var names=["Syracuse","Leontini","Lilybaeum","Panormus","Messana","Tauromenium","Tyndaris","Brixia","Patavium","Mediolanum","Verona","Mantua","Tarentum","Taras","Neapolis","Capua","Maleventum","Beneventum","Rhegium","Rhegion","Croton","Kroton","Locri","Thurii","Metapontum","Brundisium","Arpi","Canusium","Corinth","Argos","Sparta","Megalopolis","Messene","Sicyon","Elis","Patrae","Ambracia","Dodona","Corcyra","Delphi","Naupactus","Thermon","Athens","Piraeus","Chalcis","Thebes","Larissa","Demetrias","Pella","Aigai","Thessalonica","Amphipolis","Pydna","Cassandreia","Dion","Pharsalos","Phoinike","Bouthroton","Epidamnos","Apollonia","Oricum","Lissos","Scodra","Pharos","Issa","Narona","Rhizon","Olcinium","Byllis","Iader","Tragurion","Epetion","Aenona","Salona"]
	names.append_array(anatolia_names)
	for name in ["Rhodes","Kos","Samos","Chios","Mytilene"]:anatolia_names.append(name);names.append(name)
	var allowed={}
	for name in names:allowed[name]=true
	for record in world.research:
		if allowed.has(record.historicalName):research_labels.append(record)
func _process(_dt):
	if world!=null and world.uses_northern_labels():
		for marker in world.markers:
			var s=marker.site
			if world.cartographic_rollout.contains(Vector2(s.lon,s.lat)):marker.label.visible=false
	queue_redraw()
func label_at(text,geo,size,color,marker=false,offset=0.,faction_id="",subtitle="",control_color=Color.TRANSPARENT,monogram=""):
	var p=world.project(geo.x,geo.y)
	# Cull distant off-screen text before querying terrain height. Keep a generous
	# margin for mountains and label offsets at the supported oblique angles.
	if not world.camera.is_position_behind(p):
		var flat=world.camera.unproject_position(p);var margin=200.+12000./world.distance
		if not get_viewport_rect().grow(margin).has_point(flat):return false
	if not draw_heights.has(geo):draw_heights[geo]=max(.002,world.elevation(geo.x,geo.y))+.04
	p.y=draw_heights[geo]
	if world.camera.is_position_behind(p):return false
	var xy=world.camera.unproject_position(p)
	if offset is Vector2:xy+=offset
	else:xy.y+=offset
	var extent=font.get_string_size(text,HORIZONTAL_ALIGNMENT_LEFT,-1,size)
	var text_width=extent.x
	if subtitle!="":extent.x=max(extent.x,font.get_string_size(subtitle,HORIZONTAL_ALIGNMENT_LEFT,-1,12).x)
	var rect=Rect2(xy-Vector2(extent.x*.5,size),extent+Vector2(8,58 if subtitle!="" else (40 if faction_id!="" or monogram!="" else 8)))
	if not get_viewport_rect().encloses(rect):return false
	for other in occupied:
		if rect.intersects(other):return false
	occupied.append(rect)
	if marker:draw_circle(xy+Vector2(0,6),3,Color(.96,.88,.64));draw_arc(xy+Vector2(0,6),4,0,TAU,16,Color(.12,.16,.17),1.5,true)
	var pos=xy-Vector2(text_width*.5,0)
	draw_string_outline(font,pos,text,HORIZONTAL_ALIGNMENT_LEFT,-1,size,4,Color(.08,.12,.13,.85))
	draw_string(font,pos,text,HORIZONTAL_ALIGNMENT_LEFT,-1,size,color)
	if faction_id!="":
		var factions=world.political_map.factions;var index=factions.by_id[faction_id].renderIndex
		var icon=Rect2(xy+Vector2(-14,5),Vector2(28,28))
		draw_texture_rect_region(factions.atlas,icon,Rect2((index%16)*64,(index/16)*64,64,64),Color.WHITE)
	elif monogram!="":
		draw_circle(xy+Vector2(0,19),14,Color(.09,.13,.15,.95))
		var w=font.get_string_size(monogram,HORIZONTAL_ALIGNMENT_LEFT,-1,11).x
		draw_string(font,xy+Vector2(-w*.5,23),monogram,HORIZONTAL_ALIGNMENT_LEFT,-1,11,Color(.98,.91,.68))
	if control_color.a>0.:draw_arc(xy+Vector2(0,19),16,0,TAU,32,control_color.lightened(.1),2.,true)
	if subtitle!="":
		var w=font.get_string_size(subtitle,HORIZONTAL_ALIGNMENT_LEFT,-1,12).x;var caption_pos=xy+Vector2(-w*.5,50)
		draw_string_outline(font,caption_pos,subtitle,HORIZONTAL_ALIGNMENT_LEFT,-1,12,3,Color(.08,.12,.13,.9));draw_string(font,caption_pos,subtitle,HORIZONTAL_ALIGNMENT_LEFT,-1,12,Color(.91,.91,.84))
	return true
func _draw():
	if world==null or not world.uses_northern_labels():return
	var draw_start=Time.get_ticks_usec()
	occupied=[]
	draw_heights.clear()
	var displayed={}
	var political={"factions":{},"sites":{}}
	if world.anatolia_identities!=null and world.cartographic_rollout.contains_anatolia(world.focus):political=world.anatolia_identities.draw(self);displayed.merge(political.sites)
	for site in world.sites:
		if world.cartographic_rollout.contains(Vector2(site.lon,site.lat)):
			label_at(site.name,Vector2(site.lon,site.lat),16,Color(.97,.94,.84),true);displayed[site.name]=true
	# Settlement text uses immutable researched coordinates, not faction anchors.
	for record in research_labels:
		if displayed.has(record.historicalName):continue
		var anatolian=record.historicalName in anatolia_names and world.cartographic_rollout.contains_anatolia(Vector2(record.coordinates.get("lon",0.),record.coordinates.get("lat",0.)))
		if record.historicalName in anatolia_names and not anatolian:continue
		if world.distance>450. and record.coordinates.get("lon",0.)>19. and record.historicalName not in ["Athens","Sparta","Corinth","Pella","Ambracia","Epidamnos","Scodra","Issa","Iader"] and not (anatolian and record.historicalName in anatolia_major):continue
		var c=record.coordinates
		if c is Dictionary and c.has("lon") and c.has("lat") and world.cartographic_rollout.contains(Vector2(c.lon,c.lat)):
			if label_at(record.historicalName,Vector2(c.lon,c.lat),15,Color(.90,.91,.82),true):displayed[record.historicalName]=true
	var drawn_factions={}
	if world.distance>60:
		for id in world.reference_faction_ids:
			if political.factions.has(id):continue
			var factions=world.political_map.factions;var geo=factions.overlay.geographic_anchors.get(id)
			if geo==null or not world.cartographic_rollout.contains(geo):continue
			var offsets=[-38.,42.,80.,-80.] if id=="cenomani" else [42.,-44.,80.,-80.]
			if world.cartographic_rollout.contains_anatolia(geo):offsets=[-22.,22.,-45.,45.,-80.,80.]
			for offset in offsets:
				if label_at(factions.by_id[id].name.to_upper(),geo,18,Color(.98,.91,.68),false,offset,id):drawn_factions[id]=true;break
		if world.anatolia_surface!=null and world.cartographic_rollout.contains_anatolia(world.focus):
			# Presentation anchors for large empires whose main label is elsewhere.
			# Read their CURRENT owner from the unchanged region raster, never a fixed faction.
			var anchors=[Vector2(30.8,38.5),Vector2(35.8,38.4),Vector2(39.7,39.4),Vector2(30.1,40.9),Vector2(34.7,36.9)]
			anchors.sort_custom(func(a,b):return a.distance_squared_to(world.focus)<b.distance_squared_to(world.focus))
			for geo in anchors:
				var id=world.anatolia_surface.owner_at(geo)
				if id=="" or drawn_factions.has(id) or political.factions.has(id):continue
				var factions=world.political_map.factions
				if label_at(factions.by_id[id].name.to_upper(),geo,18,Color(.98,.91,.68),false,22.,id):drawn_factions[id]=true
	var regions=[["SICILY",Vector2(14.1,37.35)],["ETNA",Vector2(15.0,37.82)],["ALPS",Vector2(10.3,46.4)],["PO VALLEY",Vector2(10.9,45.02)],["APENNINES",Vector2(12.9,42.6)]]
	regions.append_array([["DINARIC ALPS",Vector2(17.3,44.0)],["PINDUS",Vector2(21.1,39.8)],["THESSALY",Vector2(22.25,39.5)],["PELOPONNESE",Vector2(22.15,37.6)]])
	if world.cartographic_rollout.settings.get("anatoliaActive",false):regions.append_array([["TAURUS",Vector2(32.5,37.25)],["PONTIC MOUNTAINS",Vector2(38.0,40.5)],["ANATOLIAN PLATEAU",Vector2(32.2,39.1)],["CAPPADOCIA",Vector2(35.0,38.5)]])
	for entry in regions:
		if world.cartographic_rollout.contains(entry[1]):label_at(entry[0],entry[1],22,Color(.75,.84,.79,.8))
	last_draw_ms=(Time.get_ticks_usec()-draw_start)/1000.
