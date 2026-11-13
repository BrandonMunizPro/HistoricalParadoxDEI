extends SceneTree
var world
var ui
var failures=[]
func _initialize():call_deferred("run")
func check(value,message):
	if not value:failures.append(message);push_error(message)
func run():
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	ui=world.campaign_ui
	for i in 120:await process_frame
	check(world.sites.size()==35,"Approved sites retained")
	check(world.research.size()==687,"Research retained")
	check(ui.top.get_child(0).mouse_filter==Control.MOUSE_FILTER_IGNORE,"Sculptural header decoration cannot intercept input")
	ui.reduced_motion=true
	var click=InputEventMouseButton.new();click.button_index=MOUSE_BUTTON_LEFT;click.pressed=true;click.position=ui.top_pull.get_global_rect().get_center()
	root.push_input(click,true);await process_frame
	click=click.duplicate();click.pressed=false;root.push_input(click,true);await process_frame
	check(world.selected=="","Pull-tab pointer input does not select map locations")
	check(ui.top_collapsed and not ui.bottom_collapsed and not ui.top.visible and ui.hud.visible,"Header collapses independently")
	ui.bottom_pull.pressed.emit()
	check(ui.top_collapsed and ui.bottom_collapsed and not ui.hud.visible,"Both chrome regions collapse")
	check(ui.top_pull.visible and ui.bottom_pull.visible,"Both decorative pull tabs remain accessible")
	check(not ui.obscures_marker(Vector2(700,70)),"Collapsed header releases map space")
	ui.top_pull.pressed.emit()
	check(not ui.top_collapsed and ui.bottom_collapsed and ui.top.visible,"Header expands without expanding HUD")
	ui.bottom_pull.pressed.emit()
	check(not ui.bottom_collapsed and ui.hud.visible,"Bottom HUD expands again")
	ui.reduced_motion=false
	for name in ui.SECTIONS:
		ui.nav[name].pressed.emit()
		check(ui.active_section==name and ui.panel.visible,"Navigation opens "+name)
		for tab in ui.tab_row.get_children():
			tab.pressed.emit();check(ui.active_tab==tab.text,"Tab selected "+tab.text)
		check(ui.content.get_child_count()>0,"Panel content exists")
	world.select_site("roma");check(ui.selected_site.name=="Roma" and world.selected=="roma","Settlement selection connected")
	check(world.goal_focus.distance_to(Vector2(world.sites[0].lon,world.sites[0].lat))<.0001,"Canonical camera focus retained")
	ui.select_tab("Future systems");check(ui.content.get_child_count()==6,"All unimplemented settlement systems labelled")
	ui.open_panel("Military");ui.nav.Military.grab_focus()
	ui.show_menu();await process_frame
	check(is_instance_valid(ui.modal) and ui.blocks_camera(),"Modal blocks camera")
	var controls=[];ui.collect_focus(ui.modal,controls)
	check(controls.size()==3,"Unsupported menu actions disabled; artwork credits available")
	var tab_event=InputEventKey.new();tab_event.pressed=true;tab_event.keycode=KEY_TAB
	ui._input(tab_event);check(ui.modal.is_ancestor_of(root.gui_get_focus_owner()),"Modal focus trapped")
	var orbit=InputEventMouseMotion.new();orbit.button_mask=MOUSE_BUTTON_MASK_RIGHT;orbit.relative=Vector2(20,0)
	var yaw_before=world.yaw;world._unhandled_input(orbit);check(world.yaw==yaw_before,"Modal rejects map orbit")
	var escape=InputEventKey.new();escape.pressed=true;escape.keycode=KEY_ESCAPE
	ui._input(escape);check(not is_instance_valid(ui.modal) and ui.panel.visible,"Escape closes modal before panel")
	check(root.gui_get_focus_owner()==ui.nav.Military,"Focus restored")
	ui._input(escape);check(not ui.panel.visible,"Escape closes panel")
	world._unhandled_input(orbit);check(world.yaw!=yaw_before,"Map orbit works outside panels")
	ui.show_settings();ui.reduced_motion=true;ui.close_modal()
	ui.activate("Diplomacy");check(is_instance_valid(ui.modal),"Diplomacy dialog opens");ui.close_modal()
	ui.activate("Decisions");check(is_instance_valid(ui.modal),"Decisions dialog opens");ui.close_modal()
	ui.open_panel("Provinces");ui.select_tab("Settlements")
	var search=ui.content.get_child(1);var results=ui.content.get_child(2)
	check(results.get_child_count()==35,"Empty search lists every approved site")
	search.text="roma";search.text_changed.emit("roma");check(results.get_child_count()==1,"Search filters canonical names")
	search.text_changed.emit("no such settlement");check(results.get_child(0) is Label,"Search empty state")
	search.text="";search.text_changed.emit("")
	for i in 30:await process_frame
	var scrolling=ui.content.get_parent();scrolling.scroll_vertical=100;await process_frame
	check(scrolling.scroll_vertical>0,"Management panel content scrolls")
	scrolling.scroll_vertical=0
	var output="res://evidence/campaign-ui-fidelity";DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	if DisplayServer.get_name()!="headless":
		await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(output+"/desktop.png")
		root.content_scale_size=Vector2i(1000,700);root.size=Vector2i(1000,700);ui.layout()
		for i in 10:await process_frame
		for key in ui.nav_icons:
			check(ui.nav[key].get_global_rect().encloses(ui.nav_icons[key].get_global_rect()),"HUD icon remains inside navigation cell: "+key)
		await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(output+"/small.png")
		ui.show_settings()
		for i in 10:await process_frame
		await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(output+"/modal-small.png")
		ui.close_modal()
		check(ui.panel.size.x<root.get_visible_rect().size.x,"Small viewport retains visible map")
		var panel_height=ui.panel.size.y
		ui.set_chrome_collapsed(true,true);ui.set_chrome_collapsed(false,true)
		check(ui.panel.size.y>panel_height,"Collapsing bars releases panel space")
		ui.set_chrome_collapsed(true,false);ui.set_chrome_collapsed(false,false)
	ui.close_panel()
	ui.reduced_motion=false;ui.open_panel("Military");ui.show_dialog("Focus check","Temporary validation dialog");ui.close_modal()
	check(ui.panel.modulate.a==1.,"Interrupted panel animation remains visible")
	ui.reduced_motion=true;ui.open_panel("Provinces");ui.select_tab("Settlements")
	for i in 4:await process_frame
	if DisplayServer.get_name()!="headless":
		await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(output+"/small.png")
	world.jump("overview");world.focus=world.goal_focus;world.distance=world.goal_distance;world.queue_tiles()
	ui.close_panel();root.content_scale_size=Vector2i(1920,1080);root.size=Vector2i(1920,1080);ui.layout()
	var cleanup_start=Time.get_ticks_msec()
	for i in 30000:
		await process_frame
		if i>90 and world.is_settled():break
		if Time.get_ticks_msec()-cleanup_start>30000:break
	if DisplayServer.get_name()!="headless":
		await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(output+"/campaign.png")
		root.content_scale_size=Vector2i(1672,941);root.size=Vector2i(1672,941);ui.layout()
		for i in 8:await process_frame
		await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(output+"/reference-size.png")
		ui.reduced_motion=false;ui.toggle_top();ui.toggle_bottom();ui.toggle_top();ui.toggle_top()
		await create_timer(.35).timeout
		check(ui.top_collapsed and ui.bottom_collapsed and not ui.top.visible and not ui.hud.visible,"Rapid independent collapse animations settle")
		await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(output+"/both-collapsed.png")
	FileAccess.open(output+"/validation.json",FileAccess.WRITE).store_string(JSON.stringify({"passed":failures.is_empty(),"failures":failures,"sites":world.sites.size(),"research":world.research.size()},"  "))
	print("CAMPAIGN_UI_VALIDATION ","PASS" if failures.is_empty() else failures)
	world.queue_free()
	for i in 30:await process_frame
	quit(0 if failures.is_empty() else 1)
