extends Control
var world
var font=ThemeDB.fallback_font
var occupied=[]
func _process(_dt):
	if world!=null and world.uses_northern_labels():
		for marker in world.markers:
			var s=marker.site
			if world.cartographic_rollout.contains(Vector2(s.lon,s.lat)):marker.label.visible=false
	queue_redraw()
func label_at(text,geo,size,color,marker=false,offset=0.,faction_id=""):
	var p=world.project(geo.x,geo.y);p.y=max(.002,world.elevation(geo.x,geo.y))+.04
	if world.camera.is_position_behind(p):return false
	var xy=world.camera.unproject_position(p)
	xy.y+=offset
	var extent=font.get_string_size(text,HORIZONTAL_ALIGNMENT_LEFT,-1,size)
	var rect=Rect2(xy-Vector2(extent.x*.5,size),extent+Vector2(8,40 if faction_id!="" else 8))
	if not get_viewport_rect().encloses(rect):return false
	for other in occupied:
		if rect.intersects(other):return false
	occupied.append(rect)
	if marker:draw_circle(xy+Vector2(0,6),3,Color(.96,.88,.64));draw_arc(xy+Vector2(0,6),4,0,TAU,16,Color(.12,.16,.17),1.5,true)
	var pos=xy-Vector2(extent.x*.5,0)
	draw_string_outline(font,pos,text,HORIZONTAL_ALIGNMENT_LEFT,-1,size,4,Color(.08,.12,.13,.85))
	draw_string(font,pos,text,HORIZONTAL_ALIGNMENT_LEFT,-1,size,color)
	if faction_id!="":
		var factions=world.political_map.factions;var index=factions.by_id[faction_id].renderIndex
		var icon=Rect2(xy+Vector2(-14,5),Vector2(28,28))
		draw_texture_rect_region(factions.atlas,icon,Rect2((index%16)*64,(index/16)*64,64,64),Color.WHITE)
	return true
func _draw():
	if world==null or not world.uses_northern_labels():return
	occupied=[]
	var displayed={}
	for site in world.sites:
		if world.cartographic_rollout.contains(Vector2(site.lon,site.lat)):
			label_at(site.name,Vector2(site.lon,site.lat),16,Color(.97,.94,.84),true);displayed[site.name]=true
	# Settlement text uses immutable researched coordinates, not faction anchors.
	for record in world.research:
		if displayed.has(record.historicalName):continue
		var names=["Syracuse","Leontini","Lilybaeum","Panormus","Messana","Tauromenium","Tyndaris","Brixia","Patavium","Mediolanum","Verona","Mantua","Tarentum","Taras","Neapolis","Capua","Maleventum","Beneventum","Rhegium","Rhegion","Croton","Kroton","Locri","Thurii","Metapontum","Brundisium","Arpi","Canusium"]
		names.append_array(["Corinth","Argos","Sparta","Megalopolis","Messene","Sicyon","Elis","Patrae","Ambracia","Dodona","Corcyra","Delphi","Naupactus","Thermon","Athens","Piraeus","Chalcis","Thebes","Larissa","Demetrias","Pella","Aigai","Thessalonica","Amphipolis","Pydna","Cassandreia","Dion","Pharsalos","Phoinike","Bouthroton","Epidamnos","Apollonia","Oricum","Lissos","Scodra","Pharos","Issa","Narona","Rhizon","Olcinium","Byllis","Iader","Tragurion","Epetion","Aenona","Salona"])
		if record.historicalName not in names:continue
		if world.distance>450. and record.coordinates.get("lon",0.)>19. and record.historicalName not in ["Athens","Sparta","Corinth","Pella","Ambracia","Epidamnos","Scodra","Issa","Iader"]:continue
		var c=record.coordinates
		if c is Dictionary and c.has("lon") and c.has("lat") and world.cartographic_rollout.contains(Vector2(c.lon,c.lat)):
			if label_at(record.historicalName,Vector2(c.lon,c.lat),15,Color(.90,.91,.82),true):displayed[record.historicalName]=true
	if world.distance>60:
		for id in world.reference_faction_ids:
			var factions=world.political_map.factions;var geo=factions.label_for(id)
			if geo==null or not world.cartographic_rollout.contains(geo):continue
			var offsets=[-38.,42.,80.,-80.] if id=="cenomani" else [42.,-44.,80.,-80.]
			for offset in offsets:
				if label_at(factions.by_id[id].name.to_upper(),geo,18,Color(.98,.91,.68),false,offset,id):break
	var regions=[["SICILY",Vector2(14.1,37.35)],["ETNA",Vector2(15.0,37.82)],["ALPS",Vector2(10.3,46.4)],["PO VALLEY",Vector2(10.9,45.02)],["APENNINES",Vector2(12.9,42.6)]]
	regions.append_array([["DINARIC ALPS",Vector2(17.3,44.0)],["PINDUS",Vector2(21.1,39.8)],["THESSALY",Vector2(22.25,39.5)],["PELOPONNESE",Vector2(22.15,37.6)]])
	for entry in regions:
		if world.cartographic_rollout.contains(entry[1]):label_at(entry[0],entry[1],22,Color(.75,.84,.79,.8))
