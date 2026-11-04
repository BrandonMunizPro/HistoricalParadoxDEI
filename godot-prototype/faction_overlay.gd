extends Control
var cartography
var anchors={}
var geographic_anchors={}
var anchor_revision=0
var font:Font
var entries=[]
func _ready():
	font=ThemeDB.fallback_font
	entries=cartography.data.factions.duplicate();entries.sort_custom(func(a,b):return a.priority>b.priority)
	refresh_anchors()
func refresh_anchors():
	anchor_revision+=1
	anchors.clear()
	geographic_anchors.clear()
	for faction in cartography.data.factions:
		var label=cartography.label_for(faction.id)
		if label==null:continue
		geographic_anchors[faction.id]=label
		var p=cartography.world.project(label.x,label.y);p.y=max(.001,cartography.world.elevation(label.x,label.y))+.04;anchors[faction.id]=p
func _process(_delta):
	if cartography.political.blend>.01:queue_redraw()
func _draw():
	var alpha=cartography.political.blend
	if alpha<=.01:return
	var viewport=cartography.world.get_viewport().get_visible_rect().size;var camera=cartography.world.camera
	var occupied=[];var hovered=null;var mouse=get_local_mouse_position()
	var sidebar=false
	for child in cartography.world.get_children():
		if child is CanvasLayer and child.name!="FactionCartography" and child.visible:sidebar=true
	for faction in entries:
		if cartography.world.has_method("uses_northern_labels") and cartography.world.uses_northern_labels() and faction.id in cartography.world.reference_faction_ids:continue
		if not anchors.has(faction.id):continue
		var p=anchors[faction.id]
		if camera.is_position_behind(p):continue
		var xy=camera.unproject_position(p)
		if xy.x<20 or xy.y<20 or xy.x>viewport.x-20 or xy.y>viewport.y-35:continue
		if sidebar and xy.x<335 and xy.y<850:continue
		var icon_size=36. if faction.priority>=80 else 26.
		var rect=Rect2(xy-Vector2(icon_size*.5,icon_size*.5),Vector2.ONE*icon_size)
		var collide=false
		for other in occupied:
			if rect.intersects(other):collide=true;break
		if collide and faction.id!=cartography.selected:continue
		occupied.append(rect.grow(2))
		var index=faction.renderIndex
		draw_texture_rect_region(cartography.atlas,rect,Rect2((index%16)*64,(index/16)*64,64,64),Color(1,1,1,alpha))
		if faction.emblem.basis=="original_design":
			var monogram=faction.emblem.monogram;var width=font.get_string_size(monogram,HORIZONTAL_ALIGNMENT_LEFT,-1,8).x
			var position=xy+Vector2(-width*.5,icon_size*.5+4)
			draw_string_outline(font,position,monogram,HORIZONTAL_ALIGNMENT_LEFT,-1,8,2,Color(.02,.02,.03,alpha));draw_string(font,position,monogram,HORIZONTAL_ALIGNMENT_LEFT,-1,8,Color(.97,.92,.77,alpha))
		var name=faction.name;var text_size=16 if faction.priority>=80 else 12
		var extent=font.get_string_size(name,HORIZONTAL_ALIGNMENT_LEFT,-1,text_size)
		var text_rect=Rect2(xy+Vector2(-extent.x*.5,icon_size*.5+2),extent+Vector2(2,3))
		var hide_text=false
		for other in occupied:
			if text_rect.intersects(other):hide_text=true;break
		if not hide_text:
			var pos=text_rect.position+Vector2(0,text_size)
			draw_string_outline(font,pos,name,HORIZONTAL_ALIGNMENT_LEFT,-1,text_size,3,Color(.025,.03,.035,alpha*.95));draw_string(font,pos,name,HORIZONTAL_ALIGNMENT_LEFT,-1,text_size,Color(.96,.92,.81,alpha));occupied.append(text_rect)
		if rect.grow(8).has_point(mouse):hovered=faction
	var legend="278 BCE · "+str(entries.size())+" factions · reconstructed / provisional regions"
	draw_string_outline(font,Vector2(max(340,viewport.x-600),viewport.y-20),legend,HORIZONTAL_ALIGNMENT_LEFT,-1,13,3,Color(0,0,0,alpha));draw_string(font,Vector2(max(340,viewport.x-600),viewport.y-20),legend,HORIZONTAL_ALIGNMENT_LEFT,-1,13,Color(.91,.88,.76,alpha))
	if hovered!=null:
		var text=hovered.name+" · "+hovered.emblem.basis.replace("_"," ")
		var p=Vector2(clamp(mouse.x+18,10,viewport.x-460),clamp(mouse.y+24,30,viewport.y-50))
		draw_rect(Rect2(p-Vector2(6,17),Vector2(450,29)),Color(.035,.045,.055,.95));draw_string(font,p,text,HORIZONTAL_ALIGNMENT_LEFT,440,13,Color(.98,.94,.81))
