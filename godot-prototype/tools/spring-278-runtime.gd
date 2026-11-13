extends SceneTree
var world
var failures=[]
var checks=0
const OUTPUT="res://evidence/spring-278"
func _initialize():call_deferred("run")
func check(ok,message):
	checks+=1
	if not ok:failures.append(message);push_error(message)
func pose(point,distance):
	world.focus=point;world.goal_focus=point;world.distance=distance;world.goal_distance=distance;world.pitch=68.;world.yaw=0.;world.queue_tiles()
	var start=Time.get_ticks_msec()
	while Time.get_ticks_msec()-start<45000:
		await process_frame
		if world.is_settled() and Time.get_ticks_msec()-start>2000:break
	check(world.is_settled(),"Terrain settled at "+str(point))
	for i in 15:await process_frame
func capture(name):
	await RenderingServer.frame_post_draw
	check(root.get_texture().get_image().save_png(OUTPUT+"/"+name+".png")==OK,"Screenshot "+name)
func run():
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(OUTPUT))
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	for i in 120:await process_frame
	var cart=world.political_map.factions;var ui=world.campaign_ui;ui.reduced_motion=true
	check(cart.by_id.size()==132 and cart.regions.known_factions.size()==132,"Same 132-faction roster in rendering and political state")
	check(world.sites.size()==35 and world.research.size()==687,"Geographic catalogs retained")
	check(world.markers.size()==35 and world.political_map.points.multimesh.instance_count==35,"All canonical settlement markers retained")
	check(cart.control["territory:mamertines"]=="mamertines","Mamertines own Messana district")
	for t in cart.data.territories:
		var region=cart.regions.legacy_ids[t.id]
		check(cart.control[t.id]==cart.regions.owners[region],"Runtime ownership agrees "+t.id)
		check(cart.palette_image.get_pixel(cart.territory_indices[t.id],0).a==(0. if t.initialController=="" else 1.),"Correct owner palette "+t.id)
	for f in cart.data.factions:check(f.has("playerSelectable") and f.playerSelectable==null,"Playability undecided "+f.id)
	for id in ["yuezhi","tectosages","trocmi","tolistobogii"]:
		check(cart.label_for(id)==null and not cart.overlay.anchors.has(id),"No anachronistic starting banner "+id)
	check(cart.label_for("mamertines")==Vector2(15.556634,38.192251),"New banner at existing Messana reference")
	check(cart.by_id.mamertines.culture=="campanian","Campanian controlling community")
	check(world.political_map.metrics.layersBound,"Political shader layers bound")
	await pose(Vector2(15.5,38.05),450.)
	ui.close_panel();await capture("messana-political-map")
	ui.open_panel("Factions")
	var browser=ui.faction_browser;var model=ui.faction_model
	check(model.by_id.size()==132 and model.by_id.mamertines.playerSelectable==null,"Browser retains normal Mamertine record")
	var state=cart.control.duplicate(true);var focus_before=world.goal_focus
	browser.search.text="Mamertines";browser.search_changed("Mamertines")
	check(browser.faction_buttons.size()==1 and browser.faction_buttons.has("mamertines"),"Mamertine name search")
	browser.faction_buttons.mamertines.pressed.emit()
	for i in 10:await process_frame
	check(browser.selected_id=="mamertines" and browser.emblem("mamertines")!=null,"Mamertine detail and emblem")
	await capture("mamertines-browser-desktop")
	check(cart.control==state and world.goal_focus==focus_before,"Browser changes neither ownership nor camera")
	var future=cart.data.duplicate(true);future.factions[0].playerSelectable=true;future.factions[1].playerSelectable=false
	var other=load("res://ui/faction_browser_model.gd").new()
	var args=[world.read_json("data/factions/presentation.json"),world.read_json("data/faction-browser-groups.json"),world.read_json("data/faction-browser-research.json")]
	check(other.configure(future,args[0],args[1],args[2]) and other.by_id.size()==132,"Future true/false flags do not filter or fork faction model")
	future.factions[0].playerSelectable="AI-only"
	check(not other.configure(future,args[0],args[1],args[2]),"Invalid playability value rejected")
	root.content_scale_size=Vector2i(1000,700);root.size=Vector2i(1000,700);ui.layout()
	for i in 15:await process_frame
	check(ui.panel.position.x>=0 and ui.panel.position.y+ui.panel.size.y<=root.content_scale_size.y,"Small viewport panel remains on screen")
	await capture("mamertines-browser-small")
	ui.close_panel();world.select_site("akragas")
	check(world.selected=="akragas" and ui.selected_site.key=="akragas","Canonical settlement selection and contextual panel")
	check(world.goal_focus.distance_to(Vector2(ui.selected_site.lon,ui.selected_site.lat))<.001,"Settlement camera focus retained")
	var notes=[]
	for child in ui.content.find_children("*","Label",true,false):notes.append(child.text)
	check(" ".join(notes).contains("Akragas-Syracuse"),"Approved aggregation visible in settlement context")
	ui.close_panel()
	var result={"passed":failures.is_empty(),"checks":checks,"failures":failures,"factions":cart.by_id.size(),"regions":cart.regions.definitions.size(),"renderer":RenderingServer.get_current_rendering_method(),"adapter":RenderingServer.get_video_adapter_name()}
	FileAccess.open(OUTPUT+"/runtime-validation.json",FileAccess.WRITE).store_string(JSON.stringify(result,"  "))
	print("SPRING_278_RUNTIME ",JSON.stringify(result))
	# Drain outstanding workers before releasing the scene.
	await pose(Vector2(20.,37.),5200.)
	world.queue_free()
	for i in 30:await process_frame
	quit(0 if failures.is_empty() else 1)
