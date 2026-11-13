extends CanvasLayer
## One startup screen. Once play begins this layer can never cover the map again.
var world
var covering=true
var startup_complete=false
var preparation_started=false
var preparation_done=false
var preparation
var screen:Control
var message:Label
var detail:Label
var stable_frames=0
var began=0
var requested_focus=Vector2.INF
var requested_band=-1
var last_reason=""
var reason_started=0
var metrics={"screens":0,"blockedMs":0,"releases":[],"visiblePendingAtRelease":0,"stageMs":{}}
func record_reason(value):
	value=value.split("·")[0].strip_edges()
	if value==last_reason:return
	var now=Time.get_ticks_msec()
	if last_reason!="":metrics.stageMs[last_reason]=metrics.stageMs.get(last_reason,0)+now-reason_started
	last_reason=value;reason_started=now
func _ready():
	layer=100;process_priority=100
	screen=Control.new();screen.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);add_child(screen)
	var background=ColorRect.new();background.color=Color("171311");background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);screen.add_child(background)
	var texture=TextureRect.new();texture.texture=load("res://ui/assets/burgundy-damask.png");texture.modulate=Color(.24,.20,.18,1.);texture.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;texture.stretch_mode=TextureRect.STRETCH_SCALE;texture.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);texture.mouse_filter=Control.MOUSE_FILTER_IGNORE;screen.add_child(texture)
	var center=CenterContainer.new();center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);center.mouse_filter=Control.MOUSE_FILTER_IGNORE;screen.add_child(center)
	var margin=MarginContainer.new();margin.add_theme_constant_override("margin_left",36);margin.add_theme_constant_override("margin_right",36);center.add_child(margin)
	var box=VBoxContainer.new();box.add_theme_constant_override("separation",18);margin.add_child(box)
	var font=SystemFont.new();font.font_names=PackedStringArray(["Palatino Linotype","Georgia","DejaVu Serif"])
	for text in ["ANTIQUITY","Preparing the campaign world","Terrain, forests and coastal detail","The map will open when nearby detail is ready."]:
		var label=Label.new();label.text=text;label.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER;label.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;label.custom_minimum_size.x=420;label.add_theme_font_override("font",font);label.add_theme_color_override("font_color",Color("dfca98"));box.add_child(label)
		label.add_theme_font_size_override("font_size",36 if box.get_child_count()==1 else 19)
		if box.get_child_count()==2:message=label
		if box.get_child_count()==3:detail=label
	began=Time.get_ticks_msec();metrics.screens=1
func band():
	if world.distance<12.:return 3
	if world.distance<37.:return 2
	if world.distance<190.:return 1
	return 0
func refresh_needed():
	if requested_focus.distance_to(world.focus)>.015 or requested_band!=band():
		requested_focus=world.focus;requested_band=band();return true
	return false
func pending_reason():
	if world==null:return "Preparing the campaign world"
	if not world.queue.is_empty():return "Preparing terrain · %d tiles remaining"%world.queue.size()
	for tile in world.resident.values():
		if tile.reveal<1.:return "Settling terrain detail"
	if world.get("anatolia_surface")!=null and not world.anatolia_surface.is_ready():return "Preparing regional terrain"
	if world.get("eastern_surfaces")!=null:
		for surface in world.eastern_surfaces:
			if not surface.is_ready():return "Preparing regional terrain"
	if world.ocean_renderer!=null and not world.ocean_renderer.gpu_ready:return "Preparing ocean surfaces"
	if world.river_building:return "Preparing rivers and banks"
	if world.settlements!=null and not world.settlements.is_ready():return "Preparing settlement surroundings"
	var pending=world.scenery.visible_pending_cells()
	if not pending.is_empty():return "Preparing forests and outcrops · %d areas remaining"%pending.size()
	if world.get("coastal_focus")!=null and world.distance<12. and not world.coastal_focus.is_ready():return "Preparing shorelines and coastal cliffs"
	if covering and (world.focus.distance_to(world.goal_focus)>.0002 or abs(world.distance-world.goal_distance)>max(.002,world.distance*.004)):return "Preparing the destination view"
	return ""
func _process(_delta):
	if world==null or startup_complete:return
	if not preparation_started:
		preparation_started=true
		if world.startup_preparation_requested:
			preparation=preload("res://startup_preparation.gd").new()
			preparation.run(self)
		else:preparation_done=true
	if not preparation_done:
		detail.text="Preparing campaign assets · %d s"%int((Time.get_ticks_msec()-began)/1000.)
		return
	var reason=pending_reason()
	if reason!="":
		stable_frames=0
		message.text=reason
		record_reason(reason)
		detail.text="Preparing nearby detail · %d s"%int((Time.get_ticks_msec()-began)/1000.)
		return
	if not covering:return
	record_reason("Warming rendered detail")
	stable_frames+=1
	message.text="Finishing the campaign view"
	detail.text="Warming rendered detail"
	# Keep the 3D world drawing: first-use GPU work happens behind the screen.
	if stable_frames<6:return
	var elapsed=Time.get_ticks_msec()-began
	metrics.blockedMs+=elapsed;metrics.releases.append({"ms":elapsed,"distance":world.distance,"focus":[world.focus.x,world.focus.y]})
	if metrics.releases.size()>128:metrics.releases.pop_front()
	metrics.visiblePendingAtRelease=world.scenery.visible_pending_cells().size()
	record_reason("")
	startup_complete=true;covering=false;screen.hide()
	set_process(false);set_process_input(false)
	print("DETAIL_VIEW_REVEALED ms=",elapsed," distance=",world.distance," pending=",metrics.visiblePendingAtRelease)
func _input(event):
	if covering and (event is InputEventKey or event is InputEventMouseButton or event is InputEventMouseMotion):get_viewport().set_input_as_handled()
