extends Control
## Image-backed decoration only. No simulation, map state, or input handling.
static var cache={}
var kind="panel"
var register=""
var relief:TextureRect
static func texture(file):
	if not cache.has(file):cache[file]=load("res://ui/assets/"+file)
	return cache[file]
func _ready():
	mouse_filter=Control.MOUSE_FILTER_IGNORE
	if kind=="header":
		relief=TextureRect.new();relief.texture=texture("source/suovetaurilia-marie-lan-nguyen.jpg")
		relief.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;relief.stretch_mode=TextureRect.STRETCH_SCALE;relief.mouse_filter=Control.MOUSE_FILTER_IGNORE
		var mat=ShaderMaterial.new();mat.shader=preload("res://ui/relief.gdshader");relief.material=mat;add_child(relief)
	resized.connect(refresh);refresh()
func refresh():
	if relief!=null:
		var w=get_parent().size.x;relief.visible=w>1250
		relief.position=Vector2(w*.57,-6)-position;relief.size=Vector2(w*.29,94)
	queue_redraw()
func nine_patch(rect,left=90.,right=90.,top=16.,bottom=22.):
	var image=texture("marble-command-frame.png");var s=image.get_size()
	var sx=[0.,s.x*.145,s.x*.855,s.x];var sy=[0.,s.y*.19,s.y*.79,s.y]
	var dx=[rect.position.x,rect.position.x+left,rect.end.x-right,rect.end.x]
	var dy=[rect.position.y,rect.position.y+top,rect.end.y-bottom,rect.end.y]
	for y in 3:
		for x in 3:
			draw_texture_rect_region(image,Rect2(dx[x],dy[y],dx[x+1]-dx[x],dy[y+1]-dy[y]),Rect2(sx[x],sy[y],sx[x+1]-sx[x],sy[y+1]-sy[y]))
func marble(rect):
	var image=texture("marble-command-frame.png");var s=image.get_size()
	var area=Rect2(s.x*.2,s.y*.25,s.x*.6,s.y*.48);var ratio=rect.size.x/max(1.,rect.size.y)
	var crop=area.size
	if crop.x/crop.y>ratio:crop.x=crop.y*ratio
	else:crop.y=crop.x/ratio
	draw_texture_rect_region(image,rect,Rect2(area.get_center()-crop*.5,crop))
func disc(rect,up):
	var center=Vector2(rect.size.x*.5,rect.size.y if up else 0.)
	var radius=35.
	draw_circle(center+Vector2(1,2),radius+4,Color("241b17"))
	draw_circle(center,radius+2,Color("9f8c6e"));draw_circle(center-Vector2(0,1),radius,Color("e8d7b1"))
	var points=PackedVector2Array();var uvs=PackedVector2Array()
	for i in 64:
		var v=Vector2.from_angle(TAU*i/64.)
		points.append(center+v*(radius-4));uvs.append(v*.5+Vector2(.5,.5))
	draw_polygon(points,PackedColorArray([Color(.65,.65,.7)]),uvs,texture("burgundy-damask.png"))
	draw_arc(center,radius-6,0,TAU,64,Color("b79c65"),1.,true)
func _draw():
	var dimensions=get_parent().size;draw_set_transform(-position)
	var full=Rect2(Vector2.ZERO,dimensions)
	if kind=="pull-top" or kind=="pull-bottom":
		disc(full,kind=="pull-bottom")
		var x=dimensions.x*.5;var y=dimensions.y*.5
		var up=get_parent().text=="⌃"
		var dy=4. if up else -4.
		draw_polyline(PackedVector2Array([Vector2(x-8,y+dy),Vector2(x,y-dy),Vector2(x+8,y+dy)]),Color("e4d1a2"),2.,true)
		return
	if kind=="hud":
		nine_patch(full,110.,110.,16.,20.);return
	if kind=="header":
		var banner=texture("burgundy-damask.png");var bs=banner.get_size()
		draw_texture_rect_region(banner,Rect2(0,0,dimensions.x,84),Rect2(0,bs.y*.35,bs.x,bs.x*84./dimensions.x),Color(1.5,2.1,1.7))
		marble(Rect2(0,84,dimensions.x,48))
		for y in [81.,84.,130.]:
			draw_line(Vector2(0,y),Vector2(dimensions.x,y),Color("806b50"),2.)
			draw_line(Vector2(0,y+2),Vector2(dimensions.x,y+2),Color("eadfc9"),1.)
		# Genuine ancient sculpture photograph, background removed, never hit tested.
		draw_texture_rect(texture("pyrrhus-cutout.png"),Rect2(-7,-3,104,138),false,Color(1.02,.98,.88))
		marble(Rect2(0,128,70,9))
		var atlas=texture("antique-icons.png");var cell=atlas.get_size()/Vector2(4,3)
		draw_texture_rect_region(atlas,Rect2(110,13,65,65),Rect2(Vector2.ZERO,cell))
		if register!="":draw_string(get_theme_font("font","HistoricalHeading"),Vector2(160,118),register,HORIZONTAL_ALIGNMENT_LEFT,-1,14,Color("514636"))
		return
	if kind=="rail":
		var banner=texture("burgundy-damask.png");var bs=banner.get_size()
		draw_texture_rect_region(banner,full,Rect2(bs.x*.2,0,bs.y*dimensions.x/dimensions.y,bs.y),Color(1.15,1.5,1.2))
		for x in [2.,dimensions.x-5.]:
			draw_line(Vector2(x,0),Vector2(x,dimensions.y),Color("d8c4a0"),3.)
			marble(Rect2(x-2,0,4,dimensions.y))
		marble(Rect2(0,0,dimensions.x,16));marble(Rect2(0,dimensions.y-16,dimensions.x,16))
		return
	# Shared parchment/marble windows retain image-backed material and molding.
	marble(full)
	var image=texture("marble-command-frame.png");var s=image.get_size()
	for y in [0.,dimensions.y-14.]:
		draw_texture_rect_region(image,Rect2(0,y,dimensions.x,14),Rect2(s.x*.15,20,s.x*.7,46))
	for x in [0.,dimensions.x-7.]:
		draw_line(Vector2(x,0),Vector2(x,dimensions.y),Color("876e4c"),3.)
		draw_line(Vector2(x+3,0),Vector2(x+3,dimensions.y),Color("f2e9d9"),2.)
