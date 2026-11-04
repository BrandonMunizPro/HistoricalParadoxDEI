extends Control
var world
var font=ThemeDB.fallback_font
var occupied=[]
func _process(_dt):queue_redraw()
func label_at(text,geo,size,color,marker=false,offset=0.):
	var p=world.project(geo.x,geo.y);p.y=max(.002,world.elevation(geo.x,geo.y))+.04
	if world.camera.is_position_behind(p):return
	var xy=world.camera.unproject_position(p)
	xy.y+=offset
	var extent=font.get_string_size(text,HORIZONTAL_ALIGNMENT_LEFT,-1,size)
	var rect=Rect2(xy-Vector2(extent.x*.5,size),extent+Vector2(8,8))
	if not get_viewport_rect().encloses(rect):return
	for other in occupied:
		if rect.intersects(other):return
	occupied.append(rect)
	if marker:draw_circle(xy+Vector2(0,6),3,Color(.96,.88,.64));draw_arc(xy+Vector2(0,6),4,0,TAU,16,Color(.12,.16,.17),1.5,true)
	var pos=xy-Vector2(extent.x*.5,0)
	draw_string_outline(font,pos,text,HORIZONTAL_ALIGNMENT_LEFT,-1,size,4,Color(.08,.12,.13,.85))
	draw_string(font,pos,text,HORIZONTAL_ALIGNMENT_LEFT,-1,size,color)
func _draw():
	if world==null:return
	occupied=[]
	# Settlement text uses immutable researched coordinates, not faction anchors.
	for record in world.research:
		if record.historicalName not in ["Brixia","Patavium","Bononia","Mediolanum","Verona","Parma","Mantua"]:continue
		var c=record.coordinates
		if c is Dictionary and c.has("lon") and c.has("lat"):label_at(record.historicalName,Vector2(c.lon,c.lat),15,Color(.97,.94,.84),true)
	if world.distance>180:
		for id in ["boii","insubres","cenomani","veneti-italy","ligurian-polities","etruscan-polities"]:
			var faction=world.political_map.factions.by_id[id];var geo=faction.label
			label_at(faction.name.to_upper(),Vector2(geo[0],geo[1]),19,Color(.98,.91,.68),false,-32. if id=="cenomani" else 36.)
	for entry in [["ALPS",Vector2(10.3,46.4)],["PO VALLEY",Vector2(10.9,45.02)],["APENNINES",Vector2(10.7,44.15)]]:
		label_at(entry[0],entry[1],22,Color(.75,.84,.79,.8))
