extends VBoxContainer
## Stateful browser view over the read-only faction projection; never dispatches commands.
const Design=preload("res://ui/campaign_theme.gd")
var ui
var model
var search:LineEdit
var results:VBoxContainer
var details:VBoxContainer
var summary:Label
var expanded={}
var selected_id=""
var group_buttons={}
var faction_buttons={}
var previous_scroll=0
var fallback_atlas
var fallback_indices={}
const DETAIL_TABS=["Background","Current","Chronicle","Sources"]
var detail_tab="Background"
var detail_tabs={}
var article:VBoxContainer
var campaign_view=preload("res://ui/faction_campaign_view.gd").new()
var cartography_ref:WeakRef
var introduction:VBoxContainer
func setup(controller,read_model):
	ui=controller;model=read_model;size_flags_horizontal=Control.SIZE_EXPAND_FILL
	campaign_view.configure(ui.world.read_json("data/spring-278/settlement-relations.json"),ui.world.read_json("data/spring-278/corrections.json"),ui.world.sites,ui.world.research)
	var cart=ui.world.political_map.factions if ui.world.political_map!=null else null
	if cart!=null:
		cartography_ref=weakref(cart)
		cart.control_changed.connect(refresh_current)
	introduction=VBoxContainer.new();add_child(introduction)
	ui.label(introduction,"CULTURES & POLITIES   /   278 BCE",false,Design.GOLD)
	ui.label(introduction,"Browse the existing catalog. Groups are provisional presentation classifications; selection changes no campaign state.").add_theme_font_size_override("font_size",14)
	search=LineEdit.new();search.placeholder_text="Find a faction, alias or cultural group";search.custom_minimum_size.y=42;search.text_changed.connect(search_changed);add_child(search)
	summary=ui.label(self,"");summary.add_theme_font_size_override("font_size",14)
	results=VBoxContainer.new();add_child(results)
	details=VBoxContainer.new();add_child(details);details.hide()
	render_groups()
func search_changed(_query):
	for entry in model.grouped(search.text):expanded[entry.group.id]=true
	render_groups()
func render_groups():
	ui.clear(results);group_buttons.clear();faction_buttons.clear()
	var groups=model.grouped(search.text);var count=0
	for entry in groups:count+=entry.factions.size()
	summary.text="%d of %d factions · %d cultural %s"%[count,model.by_id.size(),groups.size(),"group" if groups.size()==1 else "groups"]
	if count==0:ui.label(results,"No faction matches this search. Try a name, alias or cultural group.");return
	for entry in groups:
		var id=entry.group.id;var open=expanded.get(id,false)
		var header=ui.button(results,("▾  " if open else "▸  ")+entry.group.name+"  ·  "+str(entry.factions.size()),toggle_group.bind(id))
		header.alignment=HORIZONTAL_ALIGNMENT_LEFT;header.toggle_mode=true;header.set_pressed_no_signal(open);header.add_theme_font_size_override("font_size",16);header.clip_text=true
		header.tooltip_text=entry.group.name+" — "+("collapse" if open else "expand")
		header.gui_input.connect(group_key.bind(id));group_buttons[id]=header
		if open:
			for faction in entry.factions:
				var row=ui.button(results,faction.name,select_faction.bind(faction.id),faction.name+" · "+faction.status.replace("_"," "))
				row.alignment=HORIZONTAL_ALIGNMENT_LEFT;row.clip_text=true;row.custom_minimum_size.y=44;row.icon=emblem(faction.id);row.expand_icon=true;row.add_theme_constant_override("icon_max_width",28);row.add_theme_color_override("icon_normal_color",Color.WHITE)
				faction_buttons[faction.id]=row
func toggle_group(id):
	expanded[id]=not expanded.get(id,false);render_groups()
	group_buttons[id].grab_focus()
func group_key(event,id):
	if event is InputEventKey and event.pressed:
		if event.keycode==KEY_RIGHT and not expanded.get(id,false):toggle_group(id);get_viewport().set_input_as_handled()
		elif event.keycode==KEY_LEFT and expanded.get(id,false):toggle_group(id);get_viewport().set_input_as_handled()
func emblem(id):
	# Reuse the exact atlas already consumed by map banners; raw icon sources live
	# under .gdignore and are deliberately not imported Texture2D resources.
	if ui.world.political_map!=null and ui.world.political_map.factions!=null:
		var catalog=ui.world.political_map.factions
		if catalog.by_id.has(id) and catalog.atlas!=null:
			var icon=AtlasTexture.new();icon.atlas=catalog.atlas;var index=catalog.by_id[id].renderIndex
			icon.region=Rect2((index%16)*64,(index/16)*64,64,64);return icon
	# The browser remains informative when the neutral-map launch flag disables
	# political rendering. Use the same existing baked atlas, never new artwork.
	if fallback_atlas==null:
		fallback_atlas=load("res://assets/factions/emblems.res")
		var factions=ui.world.read_json("data/factions/scenario-278.json").factions
		for index in factions.size():fallback_indices[factions[index].id]=index
	if fallback_atlas!=null and fallback_indices.has(id):
		var icon=AtlasTexture.new();icon.atlas=fallback_atlas;var index=fallback_indices[id]
		icon.region=Rect2((index%16)*64,(index/16)*64,64,64);return icon
	return null
func paragraph(heading,text):
	ui.label(article,heading,false,Design.GOLD).add_theme_font_size_override("font_size",15)
	ui.label(article,text).add_theme_font_size_override("font_size",16)
	article.add_child(HSeparator.new())
func select_faction(id):
	if not model.by_id.has(id):return
	if results.visible:previous_scroll=ui.content.get_parent().scroll_vertical
	selected_id=id;detail_tab="Background";detail_tabs.clear()
	search.hide();summary.hide();introduction.hide();results.hide();details.show();ui.clear(details)
	var back=ui.button(details,"‹  Cultural groups",show_groups);back.grab_focus()
	var compact=get_viewport().get_visible_rect().size.y<800.
	if compact:back.custom_minimum_size.y=36
	var row=model.by_id[id];var heading=HBoxContainer.new();details.add_child(heading)
	var image=TextureRect.new();image.texture=emblem(id);image.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;image.stretch_mode=TextureRect.STRETCH_KEEP_ASPECT_CENTERED;image.custom_minimum_size=Vector2(56,60) if compact else Vector2(76,86);image.mouse_filter=Control.MOUSE_FILTER_IGNORE;heading.add_child(image)
	var text=ui.label(heading,row.name,true);text.size_flags_horizontal=Control.SIZE_EXPAND_FILL
	if compact:text.add_theme_font_size_override("font_size",26)
	var tabs=HBoxContainer.new();details.add_child(tabs)
	for tab in DETAIL_TABS:
		var b=ui.button(tabs,tab,set_detail_tab.bind(tab));b.toggle_mode=true;b.size_flags_horizontal=Control.SIZE_EXPAND_FILL;b.add_theme_font_size_override("font_size",14);b.custom_minimum_size.y=38
		b.gui_input.connect(detail_tab_key.bind(tab));detail_tabs[tab]=b
	article=VBoxContainer.new();details.add_child(article);render_article()
	ui.content.get_parent().set_deferred("scroll_vertical",0)
func set_detail_tab(tab):
	if not tab in DETAIL_TABS or not details.visible:return
	detail_tab=tab;render_article();ui.content.get_parent().set_deferred("scroll_vertical",0)
func detail_tab_key(event,tab):
	if not event is InputEventKey or not event.pressed:return
	var i=DETAIL_TABS.find(tab)
	if event.keycode==KEY_RIGHT:i=(i+1)%DETAIL_TABS.size()
	elif event.keycode==KEY_LEFT:i=posmod(i-1,DETAIL_TABS.size())
	elif event.keycode==KEY_HOME:i=0
	elif event.keycode==KEY_END:i=DETAIL_TABS.size()-1
	else:return
	set_detail_tab(DETAIL_TABS[i]);detail_tabs[DETAIL_TABS[i]].grab_focus();get_viewport().set_input_as_handled()
func refresh_current():
	if is_visible_in_tree() and is_instance_valid(article) and details.visible and detail_tab=="Current":render_article()
func current_snapshot():return campaign_view.snapshot(selected_id,cartography_ref.get_ref() if cartography_ref!=null else null)
func render_article():
	ui.clear(article)
	for tab in detail_tabs:detail_tabs[tab].set_pressed_no_signal(tab==detail_tab)
	var row=model.by_id[selected_id]
	if detail_tab=="Background":
		var opening=model.background(selected_id)
		ui.button(article,"Open full reading view",open_reading_view)
		var story=preload("res://ui/faction_article.gd").new();article.add_child(story);story.setup(ui,opening,model.background_sources,model.group(row.groupId).name)
		return
	if detail_tab=="Current":
		var snapshot=current_snapshot()
		if not snapshot.available:paragraph("CURRENT SITUATION","Political map information is unavailable in this view.");return
		paragraph("CURRENT MAP ALLOCATION","%d territorial %s attributed to this faction on the campaign map."%[snapshot.territories.size(),"area is" if snapshot.territories.size()==1 else "areas are"] if not snapshot.territories.is_empty() else "No territorial areas are currently attributed to this faction. This alone does not mean the faction has ceased to exist.")
		if not snapshot.locations.is_empty():
			var lines=[]
			for location in snapshot.locations:lines.append(location.name+"\nOpening relationship: "+location.openingRelationship.replace("_"," "))
			paragraph("LINKED LOCATIONS","\n\n".join(lines))
		if not snapshot.territories.is_empty():paragraph("TERRITORIAL AREAS","\n".join(snapshot.territories.map(func(t):return t.name)))
		return
	if detail_tab=="Chronicle":
		paragraph("CAMPAIGN CHRONICLE","No campaign events have been recorded. Historical background remains available in the Background tab.")
		return
	paragraph("CULTURAL CLASSIFICATION",row.culture+" · "+str(model.source_cultures.get(row.culture,{}).get("family","Unclassified"))+"\n"+row.classificationNote)
	if row.classificationSource!="":paragraph("CLASSIFICATION REFERENCE",row.classificationSource)
	paragraph("CATALOG IDENTITY",row.id+"\n"+row.status.replace("_"," ").capitalize()+" · "+str(row.get("kind","Not recorded")).replace("_"," "))
	var background=model.background(selected_id)
	if background.has("researchFile"):paragraph("RESEARCH FILE",background.researchFile)
	paragraph("BACKGROUND EVIDENCE",background.get("evidenceScope","Existing catalog").replace("-"," "))
	var shown_sources={}
	for key in background.sourceKeys:
		source_section(key,model.background_sources if not background.get("legacy",false) else model.source_registry);shown_sources[key]=true
	paragraph("SCENARIO EVIDENCE & CAVEATS",row.get("notes","No historical notes recorded."))
	if row.get("label",[]).size()==2:paragraph("GEOGRAPHIC CONTEXT","Catalog map-label anchor: %.3f° longitude · %.3f° latitude. This is a presentation anchor, not an inferred capital, settlement, boundary or ownership assignment."%[row.label[0],row.label[1]])
	var visual=row.presentation.get("emblem",row.get("emblem",{}))
	paragraph("EXISTING MAP EMBLEM",("Existing catalog banner." if emblem(selected_id)!=null else "No existing emblem image is available.")+"\n"+str(visual.get("basis","Unrecorded basis")).replace("_"," ")+"\n"+str(visual.get("note","No emblem evidence note recorded."))+"\nMap banners are presentation devices, not proof of ancient national flags.")
	for key in row.get("sources",[]):
		if not shown_sources.has(key):source_section(key,model.source_registry)
	for key in visual.get("sourceKeys",[]):source_section(key,model.presentation_sources)
func source_section(key,registry):
	var source=registry.get(key,{})
	var body=str(source.get("title",key))+"\n"+str(source.get("url","No URL recorded"))
	for field in ["citation","role","evidence","license","licenseUrl"]:
		if source.has(field):body+="\n"+str(source[field])
	paragraph("SOURCE · "+key,body)
func open_reading_view():
	if selected_id=="":return
	ui.create_modal(model.by_id[selected_id].name+" · Historical background",true)
	ui.button(ui.modal_box,"Return to faction",ui.close_modal).grab_focus()
	var story=preload("res://ui/faction_article.gd").new();ui.modal_box.add_child(story);story.setup(ui,model.background(selected_id),model.background_sources,model.group(model.by_id[selected_id].groupId).name,true)
func show_groups():
	details.hide();results.show();search.show();summary.show();introduction.show()
	if faction_buttons.has(selected_id):faction_buttons[selected_id].grab_focus()
	else:search.grab_focus()
	ui.content.get_parent().set_deferred("scroll_vertical",previous_scroll)
