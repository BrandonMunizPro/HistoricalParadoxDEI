extends SceneTree
var world
var failures=[]
var checks=0
func _initialize():call_deferred("run")
func check(value,message):
	checks+=1
	if not value:failures.append(message);push_error(message)
func run():
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	for i in 120:await process_frame
	var ui=world.campaign_ui;ui.reduced_motion=true
	check(ui.top.size.y<=ui.HEADER_HEIGHT+1 and ui.hud.size.y<=ui.HUD_HEIGHT+1,"Startup chrome leaves map visible")
	var cartography=world.political_map.factions
	var controls=cartography.control.duplicate(true);var region_owners=cartography.regions.owners.duplicate(true)
	var map_selected=world.selected;var map_faction=cartography.selected;var focus_before=world.goal_focus;var distance_before=world.goal_distance
	var protected={}
	for path in ["res://data/sites.json","res://data/research-locations.json","res://data/world.json","res://data/factions/scenario-278.json","res://data/world-border-review/scenario-278.json"]:protected[path]=FileAccess.get_sha256(path)
	cartography.layer.get_child(1).get_child(0).pressed.emit()
	check(ui.active_section=="Factions" and not cartography.panel.visible,"Legacy entry opens new browser")
	ui.nav.Factions.pressed.emit()
	var browser=ui.faction_browser;var model=ui.faction_model
	check(model.by_id.size()==132 and model.by_id.has("mamertines"),"132 factions including Mamertines")
	check(model.source_cultures.size()==45,"Original cultures and targeted corrections available")
	var seen={};var total=0
	for entry in model.grouped():
		for row in entry.factions:
			check(not seen.has(row.id) and cartography.by_id.has(row.id),"Unique catalog-backed faction: "+row.id)
			seen[row.id]=true;total+=1
	check(total==132,"Every faction belongs to exactly one presentation group")
	var review=model.grouped().filter(func(entry):return entry.group.id=="classification:review")
	check(review.size()==1 and review[0].factions.size()==1 and review[0].factions[0].id=="yuezhi","Unresolved Yuezhi culture remains under review")
	var scenario=world.read_json("data/factions/scenario-278.json");var presentation=world.read_json("data/factions/presentation.json");var taxonomy=world.read_json("data/faction-browser-groups.json");var research=world.read_json("data/faction-browser-research.json")
	var other=preload("res://ui/faction_browser_model.gd").new();scenario.factions.reverse()
	check(other.configure(scenario,presentation,taxonomy,research) and JSON.stringify(other.grouped())==JSON.stringify(model.grouped()),"Grouping and sorting independent of input order")
	scenario.factions.append(scenario.factions[0].duplicate(true));check(not other.configure(scenario,presentation,taxonomy,research),"Duplicate faction IDs rejected")
	scenario=world.read_json("data/factions/scenario-278.json");scenario.factions[0].culture="unrecorded"
	check(other.configure(scenario,presentation,taxonomy,research) and other.by_id[scenario.factions[0].id].groupId=="classification:review","Unknown cultures retained for review")
	browser.search.text="ROME";browser.search.text_changed.emit("ROME")
	check(browser.faction_buttons.size()==1 and browser.faction_buttons.has("rome"),"Case-insensitive faction search")
	browser.search.text="Greek";browser.search.text_changed.emit("Greek")
	check(browser.faction_buttons.size()==18,"Cultural search crosses faction names")
	browser.search.text="no such faction";browser.search.text_changed.emit(browser.search.text)
	check(browser.results.get_child_count()==1 and browser.results.get_child(0) is Label,"No-results state")
	browser.search.text="";browser.search.text_changed.emit("")
	var group_id=model.grouped()[0].group.id;browser.expanded[group_id]=false;browser.render_groups()
	browser.group_buttons[group_id].pressed.emit();check(browser.expanded[group_id],"Accordion expands")
	var arrow=InputEventKey.new();arrow.pressed=true;arrow.keycode=KEY_LEFT
	browser.group_key(arrow,group_id);check(not browser.expanded[group_id],"Keyboard left collapses group")
	arrow.keycode=KEY_RIGHT;browser.group_key(arrow,group_id);check(browser.expanded[group_id],"Keyboard right expands group")
	var first=browser.faction_buttons.values()[0];first.pressed.emit()
	check(browser.details.visible and not browser.results.visible,"Faction button opens detail view")
	check(not browser.introduction.visible,"Faction detail prioritizes the article over repeated browser introduction")
	browser.details.get_child(0).pressed.emit();check(browser.results.visible and not browser.details.visible,"Back restores accordion view")
	for id in model.by_id:
		browser.select_faction(id)
		check(browser.selected_id==id and browser.details.get_child(1).get_child(1).text==cartography.by_id[id].name,"Detail matches source record: "+id)
		check(browser.emblem(id)!=null,"Existing emblem available: "+id)
		if checks%24==0:await process_frame
	check(model.research.size()==9,"Nine existing research overviews reused")
	check(model.backgrounds.size()==132,"Every faction has a sourced opening background")
	for id in model.backgrounds:
		var record=model.background(id)
		check(record.get("articleVersion")==2 and record.get("wordCount",0)>=240 and record.get("sections",[]).size()==5,"Substantive five-section article: "+id)
		for section in record.sections:
			check(section.sourceKeys.all(func(key):return model.background_sources.has(key)),"Resolved article references: "+id+"/"+section.id)
	var opening=model.background("mamertines");var independent=model.background("mamertines");independent.text="Changed by caller"
	check(model.background("mamertines").text==opening.text,"Background accessor protects the fixed opening text")
	browser.select_faction("mamertines")
	for tab in browser.DETAIL_TABS:
		browser.detail_tabs[tab].pressed.emit()
		check(browser.detail_tab==tab and browser.article.get_child_count()>0,"Working faction detail tab: "+tab)
	browser.set_detail_tab("Background");arrow.keycode=KEY_RIGHT
	browser.detail_tab_key(arrow,"Background")
	check(browser.detail_tab=="Current" and browser.detail_tabs.Current.has_focus(),"Arrow key moves and focuses detail tab")
	check(browser.current_snapshot().locations.any(func(row):return row.name=="Messana"),"Current Mamertine view reads explicit Messana district")
	check(cartography.set_region_controller("territory:mamertines","rome"),"Existing ownership adapter updates test state")
	check(browser.current_snapshot().territories.is_empty() and browser.article.get_child(1).text.contains("No territorial areas"),"Open Current view refreshes immediately on actual owner change")
	check(model.background("mamertines")==opening,"Ownership changes never rewrite opening background")
	browser.select_faction("rome");browser.set_detail_tab("Current")
	check(browser.current_snapshot().locations.any(func(row):return row.name=="Messana"),"Current view follows the new map allocation")
	check(browser.current_snapshot().locations.any(func(row):return row.name=="Neapolis" and row.openingRelationship=="allied_treaty"),"Treaty context is not relabelled as direct administration")
	check(cartography.restore_region_state({"version":1,"owners":region_owners}),"Restore original campaign state after interaction test")
	browser.select_faction("yuezhi");browser.set_detail_tab("Current")
	check(browser.current_snapshot().territories.is_empty(),"Background identities are not reported as destroyed factions")
	check(not browser.campaign_view.snapshot("rome",null).available,"Neutral/missing political adapter reports unavailable state")
	var background_catalog=world.read_json("data/faction-backgrounds.json");background_catalog.records.mamertines.sourceKeys=["nonexistent-source"]
	check(not other.configure(world.read_json("data/factions/scenario-278.json"),presentation,taxonomy,research,background_catalog),"Invalid historical source references rejected")
	background_catalog=world.read_json("data/faction-backgrounds.json");background_catalog.records.mamertines.sections[0].sourceKeys=["missing-section-source"]
	check(not other.configure(world.read_json("data/factions/scenario-278.json"),presentation,taxonomy,research,background_catalog),"Invalid section references rejected")
	background_catalog=world.read_json("data/faction-backgrounds.json");background_catalog.records.mamertines.sections[1].id="origins"
	check(not other.configure(world.read_json("data/factions/scenario-278.json"),presentation,taxonomy,research,background_catalog),"Duplicate article sections rejected")
	check(cartography.control==controls and cartography.regions.owners==region_owners,"Browsing never changes territorial ownership")
	check(world.selected==map_selected and cartography.selected==map_faction,"Browsing does not mutate map selection")
	check(world.goal_focus==focus_before and world.goal_distance==distance_before,"Browsing does not move camera")
	for path in protected:check(FileAccess.get_sha256(path)==protected[path],"Protected input unchanged: "+path)
	var output="res://evidence/faction-browser";DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output))
	var dossier_output="res://evidence/faction-articles";DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(dossier_output))
	browser.select_faction("rome")
	for i in 10:await process_frame
	await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(dossier_output+"/background-desktop.png")
	var article_view=browser.article.get_child(1)
	article_view.jump_to("external");await process_frame
	check(ui.content.get_parent().scroll_vertical>0 and article_view.headings.external.has_focus(),"Sidebar contents scroll to and focus the requested section")
	article_view.jump_reference(article_view.entry.sourceKeys[0]);await process_frame
	check(article_view.references[article_view.entry.sourceKeys[0]].has_focus(),"Section reference jumps to its citation")
	ui.content.get_parent().scroll_vertical=0;browser.article.get_child(0).grab_focus()
	var return_focus=browser.article.get_child(0)
	return_focus.pressed.emit()
	for i in 10:await process_frame
	check(is_instance_valid(ui.modal) and ui.reading_modal and ui.modal_card.size.x>=950,"Full reader opens a wide historical article")
	check(ui.blocks_camera(),"Full reader blocks campaign camera input")
	var reader=ui.modal_box.get_child(ui.modal_box.get_child_count()-1)
	check(reader.headings.size()==6,"Reader displays every section and references")
	check(ui.modal_box.get_parent().follow_focus,"Reader keeps keyboard navigation in view")
	await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(dossier_output+"/reader-desktop.png")
	reader.jump_to("internal")
	for i in 3:await process_frame
	check(ui.modal_box.get_parent().scroll_vertical>0 and reader.headings.internal.has_focus(),"Reader contents navigation scrolls and focuses section")
	await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(dossier_output+"/reader-section-desktop.png")
	reader.jump_to("references")
	for i in 3:await process_frame
	check(reader.headings.references.has_focus(),"Contents includes a working References destination")
	await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(dossier_output+"/reader-references-desktop.png")
	var tab_event=InputEventKey.new();tab_event.keycode=KEY_TAB;tab_event.pressed=true;ui._input(tab_event)
	check(ui.modal.is_ancestor_of(root.gui_get_focus_owner()),"Reader keyboard focus stays within modal")
	var close_event=InputEventKey.new();close_event.keycode=KEY_ESCAPE;close_event.pressed=true;ui._input(close_event)
	check(not is_instance_valid(ui.modal) and ui.panel.visible and return_focus.has_focus(),"Escape closes reader and restores faction panel focus")
	browser.set_detail_tab("Current")
	for i in 5:await process_frame
	await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(dossier_output+"/current-desktop.png")
	browser.show_groups();browser.search.text="";browser.expanded.clear();browser.render_groups();ui.content.get_parent().scroll_vertical=0
	for i in 15:await process_frame
	check(ui.top.size.y<=ui.HEADER_HEIGHT+1 and ui.hud.size.y<=ui.HUD_HEIGHT+1,"Faction browsing preserves chrome bounds")
	ui.content.get_parent().scroll_vertical=160;await process_frame
	check(ui.content.get_parent().scroll_vertical>0,"Large cultural catalog scrolls")
	ui.content.get_parent().scroll_vertical=0
	await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(output+"/groups-desktop.png")
	browser.search.text="Greek";browser.search.text_changed.emit("Greek")
	for i in 5:await process_frame
	await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(output+"/expanded-desktop.png")
	browser.search.text="Rome";browser.search.text_changed.emit("Rome")
	for i in 5:await process_frame
	await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(output+"/search-desktop.png")
	browser.faction_buttons.rome.pressed.emit()
	for i in 10:await process_frame
	await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(output+"/detail-desktop.png")
	browser.show_groups();browser.search.text="classification review";browser.search.text_changed.emit(browser.search.text)
	for i in 5:await process_frame
	await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(output+"/review-desktop.png")
	root.content_scale_size=Vector2i(1000,700);root.size=Vector2i(1000,700);ui.layout();browser.show_groups();browser.search.text="";browser.search_changed("")
	for i in 10:await process_frame
	await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(output+"/groups-small.png")
	browser.select_faction("hibernian-polities")
	for i in 10:await process_frame
	check(browser.detail_tabs.Sources.get_global_rect().end.x<=ui.panel.get_global_rect().end.x,"Detail tabs fit the smaller viewport")
	check(browser.detail_tabs.Background.get_global_rect().end.y<ui.panel.get_global_rect().end.y-60,"Small viewport exposes detail tabs and article space")
	await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(dossier_output+"/background-small.png")
	browser.article.get_child(0).grab_focus();browser.article.get_child(0).pressed.emit()
	for i in 10:await process_frame
	check(ui.modal_card.get_global_rect().position.x>=0 and ui.modal_card.get_global_rect().end.x<=1000 and ui.modal_card.get_global_rect().end.y<=700,"Reader fits a 1000 by 700 viewport")
	await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png(dossier_output+"/reader-small.png")
	ui.modal_box.get_child(3).pressed.emit()
	check(not is_instance_valid(ui.modal) and ui.panel.visible,"Reader return button restores the faction panel")
	var escape=InputEventKey.new();escape.keycode=KEY_ESCAPE;escape.pressed=true;ui._input(escape)
	check(not ui.panel.visible,"Escape closes faction panel")
	var orbit=InputEventMouseMotion.new();orbit.relative=Vector2(12,0);orbit.button_mask=MOUSE_BUTTON_MASK_RIGHT;var yaw=world.yaw
	world._unhandled_input(orbit);check(world.yaw!=yaw,"Map orbit preserved outside panel")
	var counts={}
	for entry in model.grouped():counts[entry.group.name]=entry.factions.size()
	FileAccess.open(output+"/validation.json",FileAccess.WRITE).store_string(JSON.stringify({"passed":failures.is_empty(),"checks":checks,"failures":failures,"factions":model.by_id.size(),"groups":counts,"researchOverviews":model.research.size(),"reviewIds":review[0].factions.map(func(f):return f.id)},"  "))
	FileAccess.open(dossier_output+"/validation.json",FileAccess.WRITE).store_string(JSON.stringify({"passed":failures.is_empty(),"checks":checks,"failures":failures,"articles":model.backgrounds.size(),"viewports":["1920x1080","1000x700"]},"  "))
	print("FACTION_BROWSER_VALIDATION ","PASS" if failures.is_empty() else failures," checks=",checks)
	world.jump("overview");world.focus=world.goal_focus;world.distance=world.goal_distance;world.queue_tiles()
	var start=Time.get_ticks_msec()
	while not world.is_settled() and Time.get_ticks_msec()-start<30000:await process_frame
	world.queue_free()
	for i in 30:await process_frame
	quit(0 if failures.is_empty() else 1)
