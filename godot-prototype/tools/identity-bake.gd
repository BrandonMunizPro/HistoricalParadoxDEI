extends SceneTree
func _initialize():call_deferred("run")
func run():
	var kit=load("res://settlement_identity_kit.gd").new();kit.identity_materials();var report=[]
	for far in [false,true]:
		var suffix="-far" if far else ""
		for level in range(1,4):
			for kind in ["forum","sanctuary","farm","market","spectacle","granary"]:
				kit.begin(900+level,far);kit.color=Color.WHITE
				match kind:
					"forum":kit.civic_identity(level)
					"sanctuary":kit.sanctuary_identity(level)
					"farm":kit.farm_identity(level)
					"market":kit.market_identity(level)
					"spectacle":kit.spectacle_identity(level)
					"granary":kit.grain_stage(level)
				report.append(kit.identity_save(kind+"-"+str(level)+suffix));await process_frame
		for i in 6:kit.begin(1000+i,far);kit.color=Color.WHITE;kit.urban_block(i);report.append(kit.identity_save("urban-block-"+str(i)+suffix));await process_frame
		for i in 3:kit.begin(1100+i,far);kit.color=Color.WHITE;kit.rural_cluster(i);report.append(kit.identity_save("rural-cluster-"+str(i)+suffix));await process_frame
	kit.begin(1200);kit.color=Color.WHITE;kit.crop_tuft();report.append(kit.identity_save("crop-tuft"))
	var f=FileAccess.open("res://assets/settlement-identities/geometry-manifest.json",FileAccess.WRITE);f.store_string(JSON.stringify(report,"  "));f.close();print("IDENTITY_BAKED ",report.size());quit()
