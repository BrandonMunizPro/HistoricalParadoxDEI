extends "res://tools/map-repair-validate.gd"
func run():
	directory="res://evidence/factions-20261030/native"
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--output="):directory=arg.trim_prefix("--output=")
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(directory))
	RenderingServer.render_loop_enabled=false;process_frame.connect(draw)
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	for child in world.get_children():
		if child is CanvasLayer and child.name!="FactionCartography":child.visible=false
	await pose(5200.,Vector2(20.,37.),0.,68.)
	var faction=world.political_map.factions
	check("Presentation covers all factions without changing the scenario roster",faction.presentation.factions.size()==131 and faction.by_id.size()==131)
	check("Coin motifs resolve consistently in Godot",faction.by_id.seleucids.emblem.motif=="anchor" and faction.by_id["ptolemaic-egypt"].emblem.motif=="eagle" and faction.by_id.athens.emblem.motif=="owl" and faction.by_id.rhodes.emblem.motif=="rose")
	check("Later adaptations are explicitly classified",faction.by_id.rome.emblem.basis=="later_regional_motif" and faction.by_id.massylii.emblem.basis=="later_regional_motif")
	var raster_ok=faction.raster_emblems.size()==131
	for id in faction.raster_emblems:raster_ok=raster_ok and faction.raster_emblems[id]
	check("All factions use the supplied raster banner set",raster_ok)
	var all_fields_opaque=true
	for i in faction.data.territories.size():all_fields_opaque=all_fields_opaque and faction.palette_image.get_pixel(i+2,0).a==1.
	check("All faction fields use the defined full-strength palette",all_fields_opaque)
	check("Full faction roster binds through existing political renderer",faction.data.factions.size()==131 and faction.data.territories.size()==128 and world.political_map.metrics.layersBound)
	check("Cultural families remain separate from faction controllers",faction.by_id.rome.culture=="roman" and faction.by_id.massylii.culture=="numidian" and faction.control["territory:rome"]=="rome")
	var ids=faction.ids;var original_ids=ids.get_image().get_data()
	var colored=0;faction.layer.visible=false;var terrain=image_now();faction.layer.visible=true
	for id in ["rome","carthage","ptolemaic-egypt","seleucids","massylii","masaesyli","arverni","insubres","macedonian-claimants","pontus","atropatene","armenia"]:
		var geo=faction.by_id[id].label;var point=world.project(geo[0],geo[1]);point.y=world.elevation(geo[0],geo[1]);var pixel=world.camera.unproject_position(point)
		if pixel.x<0 or pixel.y<0 or pixel.x>=root.size.x or pixel.y>=root.size.y:continue
		var color=terrain.get_pixel(int(pixel.x),int(pixel.y))
		if max(color.r,max(color.g,color.b))-min(color.r,min(color.g,color.b))>.04:colored+=1
	check("Actual strategic land pixels display faction colors",colored>=9,{"coloredLandProbes":colored})
	var image=ids.get_image();var anchors_ok=true
	for i in faction.data.territories.size():
		var territory=faction.data.territories[i];var point=faction.placements[territory.initialController]
		var x=floori((point[0]+12.)/87.*image.get_width());var y=floori((62.-point[1])/50.*image.get_height());var pixel=image.get_pixel(x,y);var actual=roundi(pixel.r*255.)+256*roundi(pixel.g*255.)
		anchors_ok=anchors_ok and actual==i+2
	check("All territorial display anchors lie in their own resolved region",anchors_ok)
	check("Galatian arrivals have presence markers without settled territory",faction.label_for("tectosages")!=null and not faction.control.values().has("tectosages") and not faction.by_id.has("bactria") and not faction.by_id.has("parthia"))
	var old_color=Color(faction.by_id.rome.color);var entry=faction.territory_indices["territory:rome"];var previous_palette=faction.palette_image.get_data();var previous_emblem=faction.atlas.get_image().get_data()
	check("Live faction color update changes palette and preserves raster emblem",faction.set_faction_color("rome",Color("235fa9")) and faction.palette_image.get_data()!=previous_palette and faction.atlas.get_image().get_data()==previous_emblem)
	check("Color update preserves original territory raster",ids.get_image().get_data()==original_ids)
	faction.set_faction_color("rome",old_color)
	check("Control transfer updates palette and suppresses landless map label",faction.set_region_controller("territory:samnites","rome") and faction.control["territory:samnites"]=="rome" and faction.label_for("samnites")==null)
	check("Control transfer preserves geography and identities",ids.get_image().get_data()==original_ids and faction.by_id.size()==131)
	faction.set_region_controller("territory:samnites","samnites")
	var current_control=faction.control.duplicate();var current_palette=faction.palette_image.get_data()
	check("Invalid controller or region cannot mutate state",not faction.set_region_controller("missing","rome") and not faction.set_region_controller("territory:rome","missing") and faction.control==current_control and faction.palette_image.get_data()==current_palette)
	faction.populate_list("Massylian")
	for i in 3:await process_frame
	var massylian_buttons=faction.list.get_children().filter(func(c):return c is Button)
	check("Faction roster search recognizes requested Massylian alias",massylian_buttons.size()==1 and massylian_buttons[0].text=="Massylii")
	await pose(2200.,Vector2(8.,30.),0.,65.)
	faction.panel.visible=true;faction.filter.text="Massylian";faction.populate_list("Massylian")
	faction.focus_faction("massylii");world.goal_focus=world.focus;world.goal_distance=world.distance
	for i in 4:await process_frame
	image_now().save_png(directory+"/roster-numidia.png")
	faction.focus_faction("carthage")
	check("Roster focus uses existing geographic camera goals",world.goal_focus==Vector2(faction.by_id.carthage.label[0],faction.by_id.carthage.label[1]) and world.goal_distance>=180.)
	faction.panel.visible=false;faction.filter.text="";faction.populate_list("")
	for i in 3:await process_frame
	var faction_names=faction.data.factions.map(func(f):return f.name)
	var available=0
	for child in faction.list.get_children():
		if child is Button and child.text in faction_names:available+=1
	check("All factions remain available in the roster",available==131)
	for view in JSON.parse_string(FileAccess.get_file_as_string("res://evidence/factions-20261030/before/views.json")).views:
		if not view.name in ["water-control","roma-control"]:continue
		await pose(view.preset[2],Vector2(view.preset[0],view.preset[1]),view.preset[4],view.preset[3])
		world.comparison_camera={"position":view.camera.position,"distance":view.preset[2],"pitch":view.preset[3],"yaw":view.preset[4]}
		for i in 4:await process_frame
		var before=Image.load_from_file("res://evidence/factions-20261030/before/"+view.name+".png");var after=image_now();var delta=difference(before,after,Rect2i(0,0,1920,1080))
		if delta.mean>=.0001:
			before.save_png(directory+"/"+view.name+"-before.png");after.save_png(directory+"/"+view.name+"-after.png")
		check("Close geographic presentation preserved: "+view.name,delta.mean<.0001,delta)
	check("Approved zoom transition thresholds unchanged",world.political_map.settings.transition_begin_km==60. and world.political_map.settings.transition_full_km==180. and world.political_map.blend==0.)
	world.validate_geography();check("Protected settlements and retained research unchanged",world.sites.size()==35 and world.research.size()==687)
	var success=checks.all(func(c):return c.passed)
	print("FACTION_MAP_NATIVE ",success," checks=",checks.size())
	for i in 20000:
		await process_frame
		if i>90 and world.is_settled():break
	world.queue_free()
	for i in 10:await process_frame
	quit(0 if success else 1)
