extends SceneTree
func _initialize():call_deferred("run")
func run():
	var kit=load("res://roma_showcase_kit.gd").new();kit.materials()
	var report=[]
	for i in 6:kit.begin(278+i);kit.residence(i);report.append(kit.finish("home-"+str(i)));await process_frame
	for i in 2:kit.begin(310+i);kit.atrium(i);report.append(kit.finish("atrium-"+str(i)));await process_frame
	for i in 2:kit.begin(350+i);kit.shops(i);report.append(kit.finish("shops-"+str(i)));await process_frame
	for i in 2:kit.begin(380+i);kit.workshop(i);report.append(kit.finish("workshop-"+str(i)));await process_frame
	kit.begin(401);kit.warehouse();report.append(kit.finish("warehouse"));await process_frame
	kit.begin(402);kit.temple();report.append(kit.finish("temple"));await process_frame
	kit.begin(403);kit.wall();report.append(kit.finish("wall"));await process_frame
	kit.begin(404);kit.paving();report.append(kit.finish("paving"));await process_frame
	kit.begin(405);kit.civic();report.append(kit.finish("civic"));await process_frame
	for i in 4:
		kit.begin(500+i);kit.tree(i);report.append(kit.finish("tree-"+str(i)));await process_frame
	for i in 6:kit.begin(278+i,true);kit.residence(i);report.append(kit.finish("home-"+str(i)+"-far"));await process_frame
	for i in 2:kit.begin(310+i,true);kit.atrium(i);report.append(kit.finish("atrium-"+str(i)+"-far"));await process_frame
	for i in 2:kit.begin(350+i,true);kit.shops(i);report.append(kit.finish("shops-"+str(i)+"-far"));await process_frame
	for i in 2:kit.begin(380+i,true);kit.workshop(i);report.append(kit.finish("workshop-"+str(i)+"-far"));await process_frame
	kit.begin(401,true);kit.warehouse();report.append(kit.finish("warehouse-far"));await process_frame
	kit.begin(402,true);kit.temple();report.append(kit.finish("temple-far"));await process_frame
	kit.begin(405,true);kit.civic();report.append(kit.finish("civic-far"));await process_frame
	for i in 4:kit.begin(500+i,true);kit.tree(i,true);report.append(kit.finish("tree-"+str(i)+"-far"));await process_frame
	var file=FileAccess.open(kit.FOLDER+"geometry-manifest.json",FileAccess.WRITE);file.store_string(JSON.stringify({"source":"Original authored modular Roma showcase meshes","units":"kilometres; authored in metres","period":"Interpretive Italic/early Republican; not a surveyed reconstruction","meshes":report},"  "));file.close()
	print("SHOWCASE_BAKED ",report.size()," original meshes")
	quit()
