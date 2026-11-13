extends Control
## Original, resolution-independent classical carving. Decorative, never hit tested.
var crimson=false
var wreath=false
func _ready():
	mouse_filter=Control.MOUSE_FILTER_IGNORE;resized.connect(queue_redraw)
func _draw():
	var size=get_parent().size
	draw_set_transform(-position)
	var gold=Color("b7945c");var light=Color("f6e8c9");var shade=Color("776047")
	draw_rect(Rect2(Vector2(4,4),size-Vector2(8,8)),light,false,1.)
	draw_rect(Rect2(Vector2(7,7),size-Vector2(14,14)),shade,false,1.)
	for y in [10.,size.y-14.]:
		draw_line(Vector2(10,y),Vector2(size.x-10,y),gold,1.)
		for x in range(16,int(size.x)-24,20):
			var points=PackedVector2Array([Vector2(x,y),Vector2(x,y+5),Vector2(x+12,y+5),Vector2(x+12,y-3),Vector2(x+5,y-3),Vector2(x+5,y+2)])
			draw_polyline(points,shade if not crimson else gold,1.,true)
	for x in [15.,size.x-15.]:
		for y in [25.,size.y-25.]:
			draw_colored_polygon(PackedVector2Array([Vector2(x,y-5),Vector2(x+5,y),Vector2(x,y+5),Vector2(x-5,y)]),gold)
	if wreath:
		var center=Vector2(49,size.y*.5)
		for side in [-1,1]:
			for i in 9:
				var angle=deg_to_rad(48.+i*12.)
				var p=center+Vector2(side*sin(angle)*26,cos(angle)*30)
				var direction=Vector2(side*.8,-.6).rotated(side*float(i)*-.09)
				var normal=direction.orthogonal()*3.
				draw_colored_polygon(PackedVector2Array([p-direction*6.,p+normal,p+direction*6.,p-normal]),gold)
			draw_line(center+Vector2(0,29),center+Vector2(side*20,18),gold,1.,true)
		# A restrained procession relief, drawn from original geometric forms.
		# It carries no faction or historical identity.
		if size.x>1250:
			var start=size.x*.59;var finish=size.x-100
			var relief=Color("c5ad8a");relief.a=.35
			draw_line(Vector2(start,70),Vector2(finish,70),relief,2.,true)
			for i in range(int((finish-start)/58)):
				var x=start+i*58
				draw_circle(Vector2(x+17,27),5,relief)
				draw_colored_polygon(PackedVector2Array([Vector2(x+12,33),Vector2(x+23,34),Vector2(x+30,59),Vector2(x+9,59)]),relief)
				for pair in [[Vector2(x+14,59),Vector2(x+10,69)],[Vector2(x+24,59),Vector2(x+29,69)],[Vector2(x+13,37),Vector2(x+2,49)],[Vector2(x+24,37),Vector2(x+35,43)],[Vector2(x+35,17),Vector2(x+35,68)]]:
					draw_line(pair[0],pair[1],relief,3.,true)
