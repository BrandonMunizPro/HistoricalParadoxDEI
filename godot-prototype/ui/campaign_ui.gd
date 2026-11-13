extends CanvasLayer
## Presentation only. No simulation commands, ownership or historical assignments.
const Design=preload("res://ui/campaign_theme.gd")
const SECTIONS={
	"Factions":["Cultures","Diplomacy","Relations"],
	"Government":["Overview","Laws","Officials"],
	"Military":["Armies","Navies","Recruitment"],
	"Economy":["Treasury","Trade","Resources"],
	"Provinces":["Regions","Settlements","Development"],
	"Characters":["Court","Families","Leaders"],
	"Technology":["Research","Discoveries","Progress"],
	"Records":["Chronicle","Events","Statistics"]}
const ICONS={"Factions":"⚑","Government":"▥","Military":"⚔","Economy":"◈","Provinces":"▦","Characters":"♙","Technology":"✧","Diplomacy":"⚖","Decisions":"◇","Records":"▤","Settings":"⚙"}
var world
var root:Control
var panel:PanelContainer
var panel_box:VBoxContainer
var content:VBoxContainer
var tab_row:HBoxContainer
var title:Label
var active_section=""
var active_tab=""
var nav={}
var modal:Control
var modal_box:VBoxContainer
var reading_modal=false
var restore_focus:WeakRef
var reduced_motion=false
var transition:Tween
var selected_site={}
var hud:PanelContainer
var top:PanelContainer
var modal_card:PanelContainer
var top_collapsed=false
var bottom_collapsed=false
var top_pull:Button
var bottom_pull:Button
var top_tween:Tween
var bottom_tween:Tween
var rail:PanelContainer
var nav_icons={}
var nav_labels={}
var brand_text:Label
var campaign_text:Label
var faction_model
var faction_browser
const HEADER_HEIGHT=132.
const HUD_HEIGHT=126.
const PULL_HEIGHT=30.
func ornament(parent,kind="panel"):
	var carving=preload("res://ui/asset_frame.gd").new();carving.kind=kind
	parent.add_child(carving);parent.move_child(carving,0);carving.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	if kind=="header":carving.register="GEOGRAPHIC FOUNDATION   ·   %d APPROVED SITES   ·   %d HISTORICAL REFERENCES"%[world.sites.size(),world.research.size()]
	if kind.begins_with("pull-"):carving.clip_contents=true
func panel_origin():return Vector2(78.,40. if top_collapsed else HEADER_HEIGHT+PULL_HEIGHT+8.)
func setup(owner):
	world=owner;name="CampaignUI";layer=10
	root=Control.new();root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);root.mouse_filter=Control.MOUSE_FILTER_IGNORE;root.theme=Design.make_theme();add_child(root)
	top=PanelContainer.new();var banner=Design.frame(Design.CRIMSON,Design.BRONZE,10);banner.content_margin_bottom=48;top.add_theme_stylebox_override("panel",banner);root.add_child(top)
	var row=HBoxContainer.new();top.add_child(row)
	var emblem=Control.new();emblem.custom_minimum_size.x=174;emblem.mouse_filter=Control.MOUSE_FILTER_IGNORE;row.add_child(emblem)
	brand_text=label(row,"HISTORICAL\nPARADOX DEI",true,Design.GILT);brand_text.custom_minimum_size.x=286;brand_text.add_theme_font_size_override("font_size",30)
	var campaign=VBoxContainer.new();campaign.size_flags_horizontal=Control.SIZE_EXPAND_FILL;row.add_child(campaign)
	campaign_text=label(campaign,"CAMPAIGN WORLD",true,Design.GILT);campaign_text.add_theme_font_size_override("font_size",30)
	label(campaign,"278 BCE  ·  GEOGRAPHIC FOUNDATION",false,Design.GILT).add_theme_font_size_override("font_size",14)
	var menu=button(row,"",show_menu,"Campaign menu");menu.icon=Design.antique_icon("Records");menu.expand_icon=true;menu.add_theme_constant_override("icon_max_width",32);menu.custom_minimum_size=Vector2(48,44);menu.add_theme_stylebox_override("normal",Design.frame(Design.CRIMSON,Design.BRONZE,8));menu.add_theme_color_override("icon_normal_color",Color.WHITE)
	ornament(top,"header")
	panel=PanelContainer.new();panel.visible=false;root.add_child(panel);world.ui_panel=panel
	panel_box=VBoxContainer.new();panel.add_child(panel_box)
	var heading=HBoxContainer.new();panel_box.add_child(heading)
	title=label(heading,"",true);title.size_flags_horizontal=Control.SIZE_EXPAND_FILL
	button(heading,"×",close_panel,"Close management panel")
	tab_row=HBoxContainer.new();panel_box.add_child(tab_row)
	var scroll=ScrollContainer.new();scroll.size_flags_vertical=Control.SIZE_EXPAND_FILL;scroll.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED;panel_box.add_child(scroll)
	content=VBoxContainer.new();content.size_flags_horizontal=Control.SIZE_EXPAND_FILL;scroll.add_child(content)
	ornament(panel)
	hud=PanelContainer.new();root.add_child(hud)
	var hud_style=Design.frame(Design.INK,Design.BRONZE,14);hud_style.content_margin_left=145;hud_style.content_margin_right=125;hud_style.content_margin_top=18;hud_style.content_margin_bottom=12;hud.add_theme_stylebox_override("panel",hud_style)
	var hud_box=VBoxContainer.new();hud.add_child(hud_box)
	hud_box.add_theme_constant_override("separation",3)
	var nav_scroll=ScrollContainer.new();nav_scroll.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_AUTO;nav_scroll.vertical_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED;hud_box.add_child(nav_scroll)
	var navigation=HBoxContainer.new();navigation.add_theme_constant_override("separation",0);navigation.size_flags_horizontal=Control.SIZE_EXPAND_FILL;nav_scroll.add_child(navigation)
	for section in ICONS:
		var b=button(navigation,"",activate.bind(section),section);b.custom_minimum_size=Vector2(118,72);b.toggle_mode=true;b.size_flags_horizontal=Control.SIZE_EXPAND_FILL;nav[section]=b
		b.add_theme_font_size_override("font_size",16)
		var slab=Design.frame(Color(0,0,0,0),Design.BRONZE,8);slab.shadow_size=0;slab.set_border_width_all(0);slab.border_width_right=1
		b.add_theme_stylebox_override("normal",slab)
		var icon=TextureRect.new();icon.texture=Design.antique_icon(section);icon.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;icon.stretch_mode=TextureRect.STRETCH_KEEP_ASPECT_CENTERED;icon.mouse_filter=Control.MOUSE_FILTER_IGNORE;icon.modulate=Color(.65,.6,.5)
		b.add_child(icon);icon.set_anchors_and_offsets_preset(Control.PRESET_CENTER_TOP);icon.offset_left=-20;icon.offset_right=20;icon.offset_top=2;icon.offset_bottom=42;nav_icons[section]=icon
		var caption=label(b,section);caption.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER;caption.add_theme_font_size_override("font_size",16)
		caption.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE);caption.offset_top=-27;caption.offset_bottom=-4;nav_labels[section]=caption
	world.status=label(hud_box,"Loading geographic world…",false,Design.MUTED);world.status.add_theme_font_size_override("font_size",13)
	ornament(hud,"hud")
	top_pull=button(root,"⌃",toggle_top,"Retract campaign header");bottom_pull=button(root,"⌄",toggle_bottom,"Retract command bar")
	for pull in [top_pull,bottom_pull]:
		for state in ["normal","hover","pressed"]:pull.add_theme_stylebox_override(state,StyleBoxEmpty.new())
		for state in ["font_color","font_hover_color","font_focus_color"]:pull.add_theme_color_override(state,Design.GILT)
		pull.custom_minimum_size=Vector2(72,PULL_HEIGHT);pull.add_theme_font_size_override("font_size",18)
		ornament(pull,"pull-top" if pull==top_pull else "pull-bottom")
	rail=PanelContainer.new();rail.add_theme_stylebox_override("panel",Design.frame(Design.CRIMSON,Design.BRONZE,10));root.add_child(rail)
	var tools=VBoxContainer.new();rail.add_child(tools)
	for tool in [["Provinces","Campaign overview",func():world.jump("overview")],["Government","Campaign strategic camera",func():world.jump("campaign")],["Galley","Sicily camera",func():world.jump("sicily")],["Military","Mount Etna camera",func():world.jump("etna")],["Technology","Toggle research reference markers",func():world.toggle_research(not world.research_enabled)]]:
		var b=button(tools,"",tool[2],tool[1]);b.icon=Design.antique_icon(tool[0]);b.expand_icon=true;b.add_theme_constant_override("icon_max_width",32);b.custom_minimum_size=Vector2(40,48);b.add_theme_color_override("icon_normal_color",Color.WHITE);b.add_theme_stylebox_override("normal",Design.frame(Color(0,0,0,0),Design.BRONZE,4))
	ornament(rail,"rail")
	# Keep legacy selection/search references available to existing validation tools.
	world.selection_label=Label.new();world.search=LineEdit.new();world.site_list=ItemList.new();world.water_toggle=CheckButton.new()
	for node in [world.selection_label,world.search,world.site_list,world.water_toggle]:node.visible=false;root.add_child(node)
	world.site_list.item_selected.connect(world.select_list);world.search.text_changed.connect(world.filter_sites);world.filter_sites("")
	get_viewport().size_changed.connect(viewport_resized)
	top.minimum_size_changed.connect(fit_chrome.call_deferred);hud.minimum_size_changed.connect(fit_chrome.call_deferred)
	layout();fit_chrome.call_deferred()
func fit_chrome():
	# Containers can retain a transient image/font minimum during construction.
	# Settle only on layout events, without adding work to the map frame loop.
	var header_height=max(HEADER_HEIGHT,top.get_combined_minimum_size().y)
	var hud_height=max(HUD_HEIGHT,hud.get_combined_minimum_size().y)
	if abs(top.size.y-header_height)>.1:top.size.y=header_height
	if abs(hud.size.y-hud_height)>.1:hud.size.y=hud_height
func viewport_resized():
	if top_tween:top_tween.kill()
	if bottom_tween:bottom_tween.kill()
	layout()
func label(parent,text,heading=false,color=Design.PAPER):
	var node=Label.new();node.text=text;node.modulate=color
	if heading:node.theme_type_variation="HistoricalHeading"
	node.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;node.mouse_filter=Control.MOUSE_FILTER_IGNORE;parent.add_child(node)
	return node
func button(parent,text,action,tooltip=""):
	var node=Button.new();node.text=text;node.tooltip_text=tooltip if tooltip!="" else text;node.custom_minimum_size.y=42;node.pressed.connect(action);parent.add_child(node)
	return node
func clear(parent):
	for child in parent.get_children():parent.remove_child(child);child.queue_free()
func section(heading,body):
	var box=PanelContainer.new();box.add_theme_stylebox_override("panel",Design.frame(Design.STONE,Color("b5a07b"),16));content.add_child(box)
	var stack=VBoxContainer.new();box.add_child(stack);label(stack,heading,false,Design.GOLD);label(stack,body)
func future(name):
	section(name+"  /  FUTURE SYSTEM","Not yet available in the geographic campaign. No ownership, values or historical assignments have been inferred. This section is reserved for a later gameplay phase.")
func layout():
	var size=get_viewport().get_visible_rect().size
	brand_text.add_theme_font_size_override("font_size",22 if size.x<1250 else 30);brand_text.custom_minimum_size.x=230 if size.x<1250 else 286
	campaign_text.add_theme_font_size_override("font_size",22 if size.x<1250 else 30)
	top.position=Vector2(0,-HEADER_HEIGHT if top_collapsed else 0.);top.size=Vector2(size.x,HEADER_HEIGHT);top.visible=not top_collapsed
	hud.position=Vector2(0,size.y if bottom_collapsed else size.y-HUD_HEIGHT);hud.size=Vector2(size.x,HUD_HEIGHT);hud.visible=not bottom_collapsed
	top_pull.position=Vector2((size.x-72)*.5,0. if top_collapsed else HEADER_HEIGHT);top_pull.size=Vector2(72,PULL_HEIGHT)
	bottom_pull.position=Vector2((size.x-72)*.5,size.y-PULL_HEIGHT if bottom_collapsed else size.y-HUD_HEIGHT-PULL_HEIGHT);bottom_pull.size=Vector2(72,PULL_HEIGHT)
	top_pull.text="⌄" if top_collapsed else "⌃";bottom_pull.text="⌃" if bottom_collapsed else "⌄"
	for pull in [top_pull,bottom_pull]:pull.get_child(0).queue_redraw()
	top_pull.tooltip_text="Expand campaign header" if top_collapsed else "Retract campaign header"
	bottom_pull.tooltip_text="Expand command bar" if bottom_collapsed else "Retract command bar"
	rail.position=Vector2(0,40. if top_collapsed else HEADER_HEIGHT);rail.size=Vector2(68,min(350.,size.y-rail.position.y-HUD_HEIGHT-12.))
	panel.position=panel_origin();panel.size=Vector2(min(490.,size.x-100),max(140.,size.y-panel.position.y-(40. if bottom_collapsed else HUD_HEIGHT+12.)))
	if is_instance_valid(modal_card):
		modal_card.size=Vector2(min(980. if reading_modal else 680.,size.x-48),min(900. if reading_modal else 650.,size.y-48));modal_card.position=(size-modal_card.size)*.5
func toggle_top():set_chrome_collapsed(true,not top_collapsed)
func toggle_bottom():set_chrome_collapsed(false,not bottom_collapsed)
func set_chrome_collapsed(header,value):
	var body=top if header else hud;var pull=top_pull if header else bottom_pull
	var old_position=body.position;var old_pull=pull.position
	if header:
		if top_tween:top_tween.kill()
		top_collapsed=value
	else:
		if bottom_tween:bottom_tween.kill()
		bottom_collapsed=value
	if transition:transition.kill()
	panel.modulate.a=1.;layout();pull.grab_focus()
	if reduced_motion:return
	var destination=body.position;var pull_destination=pull.position;body.show();body.position=old_position;pull.position=old_pull
	var tween=create_tween();tween.set_parallel(true)
	tween.tween_property(body,"position",destination,.22).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_IN_OUT)
	tween.tween_property(pull,"position",pull_destination,.22).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_IN_OUT)
	tween.chain().tween_callback(func():body.visible=not (top_collapsed if header else bottom_collapsed))
	if header:top_tween=tween
	else:bottom_tween=tween
func obscures_marker(point):
	for control in [top,hud,top_pull,bottom_pull,rail,panel]:
		if control.visible and control.get_global_rect().has_point(point):return true
	return false
func animate(node):
	if transition:transition.kill()
	# A modal may interrupt a panel entrance. Finish the previous visual state
	# before sharing the next tween, so rapid navigation cannot leave it faded.
	panel.modulate.a=1.;panel.position=panel_origin()
	if is_instance_valid(modal):modal.modulate.a=1.
	node.modulate.a=1.
	if reduced_motion:return
	node.modulate.a=0.;transition=create_tween();transition.tween_property(node,"modulate:a",1.,Design.TRANSITION)
	if node==panel:
		var destination=panel_origin();node.position=destination-Vector2(18,0)
		transition.parallel().tween_property(node,"position",destination,Design.TRANSITION).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
func activate(name):
	if name in ["Diplomacy","Decisions","Settings"]:nav[name].set_pressed_no_signal(false)
	if name=="Diplomacy":show_dialog("Diplomatic chamber","Negotiations will become available when diplomacy is implemented. No diplomatic action can be issued in this geographic phase.");return
	if name=="Decisions":show_dialog("Council of decisions","There are no actionable campaign decisions in this phase. Future decisions will show their requirements and consequences here before confirmation.");return
	if name=="Settings":show_settings();return
	open_panel(name)
func open_panel(name):
	layout()
	active_section=name;panel.show();title.text=ICONS.get(name,"◈")+"  "+name
	for key in nav:nav[key].set_pressed_no_signal(key==name)
	for key in nav_icons:nav_icons[key].modulate=Color(1.1,1.05,.9) if key==name else Color(.65,.6,.5)
	for key in nav_labels:nav_labels[key].modulate=Design.GILT if key==name else Design.PAPER
	clear(tab_row)
	var tabs=SECTIONS.get(name,["Geography","Future systems"])
	for tab in tabs:
		var b=button(tab_row,tab,select_tab.bind(tab));b.toggle_mode=true;b.size_flags_horizontal=Control.SIZE_EXPAND_FILL
	select_tab(tabs[0]);animate(panel);tab_row.get_child(0).grab_focus()
func close_panel():
	var previous=active_section;panel.hide();active_section=""
	for b in nav.values():b.set_pressed_no_signal(false)
	for icon in nav_icons.values():icon.modulate=Color(.65,.6,.5)
	for caption in nav_labels.values():caption.modulate=Design.PAPER
	if nav.has(previous):nav[previous].grab_focus()
func select_tab(tab):
	active_tab=tab
	for b in tab_row.get_children():b.set_pressed_no_signal(b.text==tab)
	clear(content)
	if active_section=="Settlement":render_settlement(tab);return
	if active_section=="Factions":
		if tab=="Cultures":show_faction_browser()
		else:future("Factions · "+tab)
	elif active_section=="Provinces":
		if tab=="Regions":
			section("EXPLORE THE CAMPAIGN","Choose a geographic camera preset. Region names describe navigation areas and do not assign political control.")
			for key in world.navigation.presets:button(content,str(key).capitalize(),func():world.jump(key))
		elif tab=="Settlements":settlement_browser()
		else:future("Settlement development")
	elif active_section=="Records":
		if tab=="Statistics":section("GEOGRAPHIC REGISTER","%d approved sites\n%d research references\nCampaign gameplay statistics are not yet available."%[world.sites.size(),world.research.size()])
		elif tab=="Events":button(content,"Read geographic campaign notice",func():show_dialog("The campaign atlas","This campaign presents the geographic foundation. Terrain and approved settlement coordinates are available for exploration; historical events are not simulated."))
		else:section("CHRONICLE","No campaign turns or historical events have been recorded in this session.")
	else:future(active_section+" · "+tab)
func show_faction_browser():
	if faction_model==null:
		faction_model=preload("res://ui/faction_browser_model.gd").new()
		var scenario=world.read_json("data/factions/scenario-278.json");var backgrounds=world.read_json("data/faction-backgrounds.json")
		# The diagnostic historical snapshot intentionally has no Mamertine record.
		if OS.get_cmdline_user_args().has("--border-baseline"):
			for id in backgrounds.records.keys():
				if not scenario.factions.any(func(f):return f.id==id):backgrounds.records.erase(id)
		if not faction_model.configure(scenario,world.read_json("data/factions/presentation.json"),world.read_json("data/faction-browser-groups.json"),world.read_json("data/faction-browser-research.json"),backgrounds):
			section("CATALOG UNAVAILABLE",faction_model.error);faction_model=null;return
	faction_browser=preload("res://ui/faction_browser.gd").new();content.add_child(faction_browser);faction_browser.setup(self,faction_model)
func settlement_browser():
	section("APPROVED SETTLEMENTS","Select a record to focus the existing map camera and inspect its geographic evidence.")
	var search=LineEdit.new();search.placeholder_text="Search approved settlements";content.add_child(search)
	var results=VBoxContainer.new();content.add_child(results)
	var populate=func(query):
		clear(results);var count=0
		for site in world.sites:
			if query.is_empty() or query.to_lower() in site.name.to_lower():button(results,site.name,world.select_site.bind(site.key));count+=1
		if count==0:label(results,"No matching approved settlements.")
	search.text_changed.connect(populate);populate.call("")
func show_settlement(site):
	selected_site=site;open_panel("Settlement");title.text=site.name
func render_settlement(tab):
	if tab=="Future systems":
		for name in ["Ownership","Garrison","Population","Buildings","Culture","Trade"]:future(name)
		return
	section("GEOGRAPHIC RECORD",selected_site.name+"\n%.6f° longitude  ·  %.6f° latitude"%[selected_site.lon,selected_site.lat])
	if selected_site.has("region"):section("REGION",str(selected_site.region))
	if selected_site.has("notes"):section("RESEARCH NOTES",str(selected_site.notes))
	section("CANONICAL IDENTIFIER",str(selected_site.id))
	# Explicit opening relationships only: never infer civic culture or treaty
	# status from the polygon beneath a settlement.
	if FileAccess.file_exists("res://data/spring-278/settlement-relations.json") and not OS.get_cmdline_user_args().has("--border-baseline"):
		var opening=world.read_json("data/spring-278/settlement-relations.json")
		for relation in opening.records:
			if relation.get("settlementId","")!=selected_site.id:continue
			section("STARTING RELATIONSHIP",relation.relationship.replace("_"," ").capitalize()+"\n"+relation.note)
			section("SETTLEMENT CULTURAL CONTEXT",relation.settlementCultureId.capitalize()+" — independent of the regional controller.")
	if selected_site.has("sources"):
		for source in selected_site.sources:section("SOURCE REFERENCE",str(source))
	button(content,"Focus settlement on map",func():world.select_site(selected_site.key))
func create_modal(heading,reading=false):
	if is_instance_valid(modal):close_modal()
	reading_modal=reading
	restore_focus=weakref(get_viewport().gui_get_focus_owner()) if get_viewport().gui_get_focus_owner()!=null else null
	modal=Control.new();modal.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);root.add_child(modal)
	var veil=ColorRect.new();veil.color=Color(0,0,0,.72);veil.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);modal.add_child(veil)
	modal_card=PanelContainer.new();modal.add_child(modal_card)
	modal_card.add_theme_stylebox_override("panel",Design.frame(Design.STONE,Design.BRONZE,28));ornament(modal_card)
	var scroll=ScrollContainer.new();scroll.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED;scroll.follow_focus=reading;modal_card.add_child(scroll)
	modal_box=VBoxContainer.new();modal_box.size_flags_horizontal=Control.SIZE_EXPAND_FILL;scroll.add_child(modal_box)
	label(modal_box,"◆   HISTORICAL PARADOX DEI   ◆",false,Design.GOLD);label(modal_box,heading,true)
	label(modal_box,"━━━━━━━━━━━━  ◇  ━━━━━━━━━━━━",false,Design.BRONZE)
	layout();animate(modal)
func show_dialog(heading,body):
	create_modal(heading);label(modal_box,body);button(modal_box,"Return to campaign",close_modal).grab_focus()
func show_menu():
	create_modal("Campaign menu")
	button(modal_box,"Continue",close_modal).grab_focus()
	for name in ["New Campaign","Load","Save"]:
		var b=button(modal_box,name+" — not yet available",func():pass);b.disabled=true;b.tooltip_text="Campaign persistence and creation are not connected to this geographic renderer."
	button(modal_box,"Settings",show_settings)
	var exit_button=button(modal_box,"Exit — use the window close control",func():pass);exit_button.disabled=true
	button(modal_box,"Artwork & licenses",show_art_credits)
func show_art_credits():
	create_modal("Artwork & licenses")
	label(modal_box,"Pyrrhus of Epirus · Naples National Archaeological Museum, Inv. 6150. Photograph © Marie-Lan Nguyen (2011), CC BY 2.5. Background removed with AI assistance; resized and color treated for decorative use.\nhttps://commons.wikimedia.org/wiki/File:Pyrrhus_MAN_Napoli_Inv6150_n02.jpg\nhttps://creativecommons.org/licenses/by/2.5/")
	label(modal_box,"Roman relief · Louvre, Ma 1096. Photograph by Marie-Lan Nguyen (2005), released into the public domain. Cropped, faded and toned. This later Roman artwork is decorative and does not depict the campaign's starting date.\nhttps://commons.wikimedia.org/wiki/File:Suovetaurile_Louvre.jpg")
	label(modal_box,"Marble architecture, burgundy material and antique icon atlas: original AI-assisted decorative assets. Full provenance and prompts are stored with the local UI assets.")
	button(modal_box,"Return to campaign",close_modal).grab_focus()
func show_settings():
	create_modal("Campaign settings")
	var motion=CheckButton.new();motion.text="Reduced UI motion";motion.button_pressed=reduced_motion;motion.toggled.connect(func(value):reduced_motion=value);modal_box.add_child(motion)
	var water=CheckButton.new();water.text="Animated water";water.button_pressed=world.water_animation_enabled;water.toggled.connect(world.set_water_animation);modal_box.add_child(water)
	var research=CheckButton.new();research.text="Show research reference markers";research.button_pressed=world.research_enabled;research.toggled.connect(world.toggle_research);modal_box.add_child(research)
	label(modal_box,"WASD / arrows: pan · Q/E: rotate\nWheel: zoom · right drag: orbit · middle drag: pan\nHome: overview · Escape: close the topmost window\nSettings apply to this session.")
	button(modal_box,"Done",close_modal).grab_focus()
func close_modal():
	if not is_instance_valid(modal):return
	root.remove_child(modal);modal.queue_free();modal=null;modal_card=null
	if restore_focus!=null and is_instance_valid(restore_focus.get_ref()):restore_focus.get_ref().grab_focus()
func blocks_camera():
	return is_instance_valid(modal) or (get_viewport().gui_get_focus_owner()!=null and panel.visible and panel.is_ancestor_of(get_viewport().gui_get_focus_owner()))
func _input(event):
	if event is InputEventKey and event.pressed:
		if event.keycode==KEY_ESCAPE:
			if is_instance_valid(modal):close_modal()
			elif panel.visible:close_panel()
			else:show_menu()
			get_viewport().set_input_as_handled()
		elif is_instance_valid(modal) and event.keycode==KEY_TAB:
			var controls=[];collect_focus(modal,controls)
			if not controls.is_empty():
				var index=controls.find(get_viewport().gui_get_focus_owner());controls[posmod(index+(-1 if event.shift_pressed else 1),controls.size())].grab_focus()
			get_viewport().set_input_as_handled()
func collect_focus(node,result):
	if node is Control and node.focus_mode==Control.FOCUS_ALL and node.is_visible_in_tree() and not (node is BaseButton and node.disabled):result.append(node)
	for child in node.get_children():collect_focus(child,result)
func _unhandled_input(event):
	if event is InputEventMouseButton and event.pressed and not is_instance_valid(modal):
		var focused=get_viewport().gui_get_focus_owner()
		if focused!=null:focused.release_focus()
