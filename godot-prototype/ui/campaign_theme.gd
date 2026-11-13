extends RefCounted
## Shared visual tokens. Kilometres and geographic data never enter this layer.
const INK=Color("e3dbcc")
const STONE=Color("e9e1d2")
const BRONZE=Color("988265")
const GOLD=Color("78552b")
const PAPER=Color("30271f")
const MUTED=Color("6a5b46")
const CRIMSON=Color("3c1118")
const GILT=Color("dfca98")
const SPACE=12
const TRANSITION=.16
static func frame(color=INK,border=BRONZE,padding=20):
	var s=StyleBoxFlat.new();s.bg_color=color;s.border_color=border
	s.set_border_width_all(2);s.border_width_top=3;s.border_width_bottom=3;s.set_content_margin_all(padding)
	s.shadow_color=Color(0,0,0,.35);s.shadow_size=6;s.shadow_offset=Vector2(0,3)
	return s
static func make_theme():
	var t=Theme.new();t.default_font_size=17
	var body=SystemFont.new();body.font_names=PackedStringArray(["Georgia","DejaVu Serif"]);t.default_font=body
	var heading=SystemFont.new();heading.font_names=PackedStringArray(["Palatino Linotype","Georgia","DejaVu Serif"])
	t.set_type_variation("HistoricalHeading","Label")
	t.set_font("font","HistoricalHeading",heading);t.set_font_size("font_size","HistoricalHeading",30)
	t.set_color("font_color","Label",Color.WHITE)
	for type in ["Button","OptionButton"]:
		t.set_stylebox("normal",type,frame(STONE,BRONZE,10))
		t.set_stylebox("hover",type,frame(Color("f5e8cc"),GOLD,10))
		t.set_stylebox("pressed",type,frame(CRIMSON,BRONZE,10))
		t.set_stylebox("disabled",type,frame(Color("d0c5af"),Color("a99c83"),10))
		var focus=frame(Color(0,0,0,0),GOLD,0);focus.set_border_width_all(2);focus.shadow_size=0
		t.set_stylebox("focus",type,focus)
		t.set_color("font_color",type,PAPER);t.set_color("font_disabled_color",type,MUTED)
		t.set_color("font_focus_color",type,PAPER)
		t.set_color("font_hover_color",type,PAPER);t.set_color("font_pressed_color",type,GILT);t.set_color("font_hover_pressed_color",type,GILT)
		t.set_color("icon_normal_color",type,Color("72552f"));t.set_color("icon_pressed_color",type,GILT)
		t.set_color("icon_hover_color",type,Color("72552f"))
		t.set_font("font",type,heading)
	t.set_stylebox("panel","PanelContainer",frame())
	t.set_stylebox("normal","LineEdit",frame(STONE,BRONZE,10))
	t.set_stylebox("panel","ItemList",frame(STONE,BRONZE,10))
	t.set_color("font_color","LineEdit",PAPER);t.set_color("font_placeholder_color","LineEdit",MUTED)
	t.set_color("font_color","ItemList",PAPER);t.set_color("font_selected_color","ItemList",PAPER)
	t.set_constant("separation","VBoxContainer",SPACE)
	t.set_constant("separation","HBoxContainer",8)
	return t
static func material():
	var m=ShaderMaterial.new();m.shader=preload("res://ui/stone.gdshader");return m
static func antique_icon(name):
	var order=["Factions","Government","Military","Economy","Provinces","Characters","Technology","Diplomacy","Decisions","Records","Settings","Galley"]
	var sheet=preload("res://ui/asset_frame.gd").texture("antique-icons.png");var i=order.find(name)
	var atlas=AtlasTexture.new();atlas.atlas=sheet
	var cell=sheet.get_size()/Vector2(4,3)
	atlas.region=Rect2(Vector2(i%4,i/4)*cell,cell);return atlas
static func icon(name):
	var paths={
		"Factions":"M5 24V4M5 5H24L20 10L24 15H5",
		"Government":"M3 12L16 4L29 12ZM5 27H27M8 14V24M16 14V24M24 14V24",
		"Military":"M7 4L24 21M7 4L8 12L20 24M17 22L24 15M23 23L28 28M25 4L7 24M4 21L11 28",
		"Economy":"M5 10C5 4 27 4 27 10C27 16 5 16 5 10ZM5 10V23C5 29 27 29 27 23V10M5 17C5 23 27 23 27 17",
		"Provinces":"M3 7L11 4L21 8L29 5V25L21 28L11 24L3 27ZM11 4V24M21 8V28",
		"Characters":"M11 11A5 5 0 1 0 21 11A5 5 0 1 0 11 11M5 28C5 16 27 16 27 28Z",
		"Technology":"M16 4L20 12L28 16L20 20L16 28L12 20L4 16L12 12Z",
		"Diplomacy":"M4 10H28M16 4V27M10 28H22M7 10L2 21H12ZM25 10L20 21H30Z",
		"Decisions":"M8 4H24V28H8ZM12 11L15 14L21 8M12 22H20",
		"Records":"M5 5H27V27H5ZM10 11H22M10 16H22M10 21H18",
		"Settings":"M16 3V8M16 24V29M3 16H8M24 16H29M7 7L11 11M21 21L25 25M7 25L11 21M21 11L25 7M10 16A6 6 0 1 0 22 16A6 6 0 1 0 10 16"}
	var svg='<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="'+paths[name]+'" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>'
	var image=Image.new();image.load_svg_from_string(svg);return ImageTexture.create_from_image(image)
