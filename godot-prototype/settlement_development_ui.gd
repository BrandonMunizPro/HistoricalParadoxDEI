extends CanvasLayer
## Explicitly labelled developer preview. Changes are transient and resettable.
var state
var world_ref:WeakRef
var slots_box
var details
var status
var selected=""
var level_buttons=[]
var panel
var title_label
var class_label
var selector
var available_models={}
func setup(model,world):
	state=model;world_ref=weakref(world);layer=20;name="SettlementDevelopmentUI"
	panel=PanelContainer.new();panel.position=Vector2(1470,28);panel.custom_minimum_size=Vector2(420,660)
	var style=StyleBoxFlat.new();style.bg_color=Color("162124f2");style.border_color=Color("a68c58");style.set_border_width_all(1);style.set_corner_radius_all(5);style.content_margin_left=20;style.content_margin_right=20;style.content_margin_top=18;style.content_margin_bottom=18;panel.add_theme_stylebox_override("panel",style);add_child(panel)
	var box=VBoxContainer.new();box.add_theme_constant_override("separation",10);panel.add_child(box)
	var settlement_name=state.settlement.settlementId
	for site in world.sites:
		if site.id==state.settlement.settlementId:settlement_name=site.name
	var title=Label.new();title.text=settlement_name.to_upper()+"  /  "+str(int(state.settlement.yearBce))+" BCE";title.add_theme_font_size_override("font_size",26);title.modulate=Color("eddcb6");box.add_child(title)
	var subtitle=Label.new();subtitle.text="SETTLEMENT DEVELOPMENT PREVIEW\n"+state.settlement.class.capitalize()+" settlement  ·  "+str(state.settlement.slots.size())+" configurable slots";subtitle.add_theme_font_size_override("font_size",15);box.add_child(subtitle)
	title_label=title;class_label=subtitle
	available_models=world.get_meta("identity_models",{})
	if available_models.size()>1:
		selector=OptionButton.new()
		for key in available_models:selector.add_item(key.capitalize())
		selector.item_selected.connect(select_settlement);box.add_child(selector)
	slots_box=VBoxContainer.new();slots_box.add_theme_constant_override("separation",6);box.add_child(slots_box)
	for slot in state.settlement.slots:
		var button=Button.new();button.alignment=HORIZONTAL_ALIGNMENT_LEFT;button.custom_minimum_size=Vector2(372,40);button.clip_text=true;button.text_overrun_behavior=TextServer.OVERRUN_TRIM_ELLIPSIS;button.pressed.connect(select_slot.bind(slot.id));button.set_meta("slotId",slot.id);slots_box.add_child(button)
	details=Label.new();details.custom_minimum_size=Vector2(370,136);details.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;details.add_theme_font_size_override("font_size",16);box.add_child(details)
	var row=HBoxContainer.new();box.add_child(row)
	for i in range(1,4):
		var button=Button.new();button.text="Level "+["I","II","III"][i-1];button.custom_minimum_size=Vector2(116,36);button.pressed.connect(preview.bind(i));row.add_child(button);level_buttons.append(button)
	var reset_button=Button.new();reset_button.text="Restore selected starting configuration";reset_button.pressed.connect(reset_selected);box.add_child(reset_button)
	var cameras=HBoxContainer.new();box.add_child(cameras)
	for definition in [["Inspect slot",.16],["City view",.48],["Strategic",45.]]:
		var button=Button.new();button.text=definition[0];button.pressed.connect(frame_selection.bind(definition[1]));cameras.add_child(button)
	status=Label.new();status.text="";status.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;status.custom_minimum_size=Vector2(370,65);status.add_theme_font_size_override("font_size",14);status.modulate=Color("d9c995");box.add_child(status)
	var note=Label.new();note.text="Preview only · no costs or production\nEffects are reserved definitions, without values.\nArchitecture is independent of future ownership.";note.add_theme_font_size_override("font_size",13);note.modulate=Color("abb6b5");box.add_child(note)
	selected=state.settlement.slots[0].id;state.changed.connect(refresh);refresh()
func reset_selected():state.reset()
func select_settlement(index):
	use_model(available_models[available_models.keys()[index]]);frame_selection(.48)
func use_model(model):
	if state==model:return
	if state.changed.is_connected(refresh):state.changed.disconnect(refresh)
	state=model;selected=state.settlement.slots[0].id;state.changed.connect(refresh)
	for button in slots_box.get_children():slots_box.remove_child(button);button.queue_free()
	for slot in state.settlement.slots:
		var button=Button.new();button.alignment=HORIZONTAL_ALIGNMENT_LEFT;button.custom_minimum_size=Vector2(372,40);button.clip_text=true;button.text_overrun_behavior=TextServer.OVERRUN_TRIM_ELLIPSIS;button.pressed.connect(select_slot.bind(slot.id));button.set_meta("slotId",slot.id);slots_box.add_child(button)
	var world=world_ref.get_ref();var settlement_name=state.settlement.settlementId
	for site in world.sites:
		if site.id==state.settlement.settlementId:settlement_name=site.name
	title_label.text=settlement_name.to_upper()+"  /  "+str(int(state.settlement.yearBce))+" BCE"
	class_label.text="SETTLEMENT DEVELOPMENT PREVIEW\n"+state.settlement.class.capitalize()+" settlement  ·  "+str(state.settlement.slots.size())+" configurable slots"
	if selector!=null:
		for i in available_models.size():
			if available_models[available_models.keys()[i]]==model:selector.select(i)
	refresh()
func select_slot(id):selected=id;refresh()
func refresh():
	for button in slots_box.get_children():
		var slot=state.slot_by_id(button.get_meta("slotId"));var prefix="› " if slot.id==selected else "  "
		button.text=prefix+str(button.get_index()+1)+"   "+("Available development slot" if slot.building==null else state.chain(slot.building.chain).levels[state.levels[slot.id]-1].name+"  "+["I","II","III"][state.levels[slot.id]-1])
	var slot=state.slot_by_id(selected)
	for b in level_buttons:b.disabled=slot.building==null
	if slot.building==null:
		var eligible=[]
		for b in state.catalog.chains:
			if state.eligibility(b.id).is_empty() and (slot.allowedCategories.is_empty() or b.category in slot.allowedCategories):eligible.append(b.id)
		details.text="Unoccupied — reserved for future development.\nEligible definitions: "+", ".join(eligible)+".\nConstruction and placement are not simulated."
		status.text="Empty slots remain available. Most catalog chains still need cultural artwork.";return
	var b=state.chain(slot.building.chain);var level=state.levels[slot.id];var a=state.resolve_visual(b.id,level)
	details.text=b.levels[level-1].name+"\nStarting level: "+str(int(slot.building.startingLevel))+" / chain maximum: "+str(int(b.maxLevel))+"\n"+(a.silhouette if not a.is_empty() else "Compatible artwork is unavailable.")+"\nBuilding: "+slot.building.confidence+". Layout: interpretive."
	var starting=level==int(slot.building.startingLevel)
	status.text=("Selected slot matches its scenario starting level." if not available_models.is_empty() else "Selected slot is at its historical starting level.") if starting else "TEMPORARY LEVEL PREVIEW — starting data is unchanged."
	if slot.building.landmark!=null:
		for landmark in state.catalog.landmarks:
			if landmark.id==slot.building.landmark:status.text+="\nLandmark modifier: "+("active (separate from building effect)" if not state.effect_references(slot.id).landmarkModifiers.is_empty() else "inactive in this preview")
func preview(level):
	if not state.set_level(selected,level):status.text=state.last_error
func frame_selection(distance):
	var world=world_ref.get_ref();var slot=state.slot_by_id(selected);var center=Vector3.ZERO
	for site in world.sites:
		if site.id==state.settlement.settlementId:center=world.project(site.lon,site.lat)
	var p=center+Vector3(slot.anchorM[0]*.001,0,slot.anchorM[1]*.001)
	world.focus=world.unproject(p);world.goal_focus=world.focus;world.distance=distance;world.goal_distance=distance;world.pitch=38.;world.yaw=15.;world.queue_tiles()
