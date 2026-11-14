extends RefCounted
## Shared resources and bounded opening-area preparation, before player input.
var warmed_variants=0
var phases=[]
func coast_baseline_ready(world):
	var coast=world.get("coastal_focus")
	return coast!=null and coast.get("baseline_ready")==true
func terrain_sample(centre):
	# Match the attribute layout of the real ArrayMesh terrain so its draw
	# pipelines are submitted, even for regions outside the opening frustum.
	var arrays=[];arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX]=PackedVector3Array([centre+Vector3(-.05,0,0),centre+Vector3(.05,0,0),centre+Vector3(0,0,.05)])
	arrays[Mesh.ARRAY_NORMAL]=PackedVector3Array([Vector3.UP,Vector3.UP,Vector3.UP])
	arrays[Mesh.ARRAY_TANGENT]=PackedFloat32Array([1,0,0,1,1,0,0,1,1,0,0,1])
	arrays[Mesh.ARRAY_TEX_UV]=PackedVector2Array([Vector2.ZERO,Vector2.RIGHT,Vector2.UP])
	arrays[Mesh.ARRAY_TEX_UV2]=PackedVector2Array([Vector2(centre.y,0),Vector2(centre.y,0),Vector2(centre.y,0)])
	arrays[Mesh.ARRAY_COLOR]=PackedColorArray([Color(.5,1,.5,1),Color(.5,1,.5,1),Color(.5,1,.5,1)])
	arrays[Mesh.ARRAY_INDEX]=PackedInt32Array([0,1,2])
	var mesh=ArrayMesh.new();mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays);return mesh
func wait_for_view(loader,full_scenery=false):
	var world=loader.world;var stable=0
	var started=Time.get_ticks_msec()
	while stable<6:
		await world.get_tree().process_frame
		var reason=loader.pending_reason()
		if reason!="":loader.message.text=reason
		var ready=reason==""
		if full_scenery:ready=ready and world.scenery.is_ready()
		stable=stable+1 if ready else 0
		# Coverage and shared resources are essential. Optional close vegetation
		# and refinement work cannot hold an otherwise coherent map indefinitely.
		if Time.get_ticks_msec()-started>60000 and world.geographical_baseline_ready() and coast_baseline_ready(world):
			loader.allow_background_detail=true;loader.metrics["detailWarmupBudgetExceeded"]=true;return
func move_view(world,point,distance):
	world.focus=point;world.goal_focus=point;world.distance=distance;world.goal_distance=distance;world.queue_tiles()
func run(loader):
	var world=loader.world
	var saved={"focus":world.focus,"goalFocus":world.goal_focus,"distance":world.distance,"goalDistance":world.goal_distance,"pitch":world.pitch,"yaw":world.yaw,"viewPitch":world.view_pitch,"viewYaw":world.view_yaw}
	var start=Time.get_ticks_msec()
	var coast_catalog=null
	if world.get("coastal_focus")!=null:coast_catalog=world.coastal_focus.get("catalog")
	if coast_catalog!=null:
		loader.message.text="Loading worldwide coastline data"
		await coast_catalog.preload_all(world.get_tree())
		phases.append({"stage":"worldCoastSources","ms":Time.get_ticks_msec()-start,"chunks":coast_catalog.chunks.size(),"bytes":coast_catalog.preloaded_bytes})
	if world.get("coastal_focus")!=null and world.coastal_focus.has_method("prepare_baseline"):
		loader.message.text="Establishing complete worldwide shorelines"
		await world.coastal_focus.prepare_baseline(world.get_tree())
		if not world.coastal_focus.baseline_ready:
			loader.message.text="World coastline data is incomplete"
			loader.metrics["initializationError"]="Missing or stale coastline baseline"
			return
		phases.append({"stage":"worldCoastGeometry","ms":Time.get_ticks_msec()-start,"coverage":world.coastal_focus.baseline.metrics.duplicate(true)})
	if world.settlements!=null and world.settlements.get("visual_pipeline")!=null and world.settlements.visual_pipeline.active:
		loader.message.text="Preparing settlement silhouettes and harbor plans"
		await world.settlements.visual_pipeline.prepare_baselines(world.get_tree())
		phases.append({"stage":"settlementBaselines","ms":Time.get_ticks_msec()-start,"settlements":world.settlements.visual_pipeline.stats.baselines,"productionAssets":world.settlements.visual_pipeline.stats.productionAssets})
	loader.message.text="Loading vegetation meshes and textures"
	# These are the actual reusable resources used by regional rendering.
	# Full geometric tree variants that the renderer never requests are excluded.
	var variants=world.scenery.meshes.duplicate()
	variants.append_array(world.scenery.coarse_meshes)
	variants.append_array(world.scenery.arid_rocks)
	for index in world.scenery.quality.variant_count:
		for coarse in [false,true]:
			var mesh=world.scenery.quality.mesh_for(index,coarse)
			if mesh!=null:variants.append(mesh)
		await world.get_tree().process_frame
	phases.append({"stage":"sharedAssets","ms":Time.get_ticks_msec()-start,"variants":variants.size()})
	loader.message.text="Preparing the opening landscape"
	move_view(world,saved.focus,min(2.,float(saved.distance)))
	# Draw each reused MultiMesh/material family under the startup cover. This
	# warms rendering resources rather than hiding nodes and assuming they drew.
	var warmup=Node3D.new();warmup.name="StartupAssetWarmup";world.add_child(warmup)
	var centre=world.project(saved.focus.x,saved.focus.y);centre.y=world.elevation(saved.focus.x,saved.focus.y)+.1
	for i in variants.size():
		var mm=MultiMesh.new();mm.transform_format=MultiMesh.TRANSFORM_3D;mm.use_colors=true;mm.use_custom_data=true;mm.mesh=variants[i];mm.instance_count=1
		mm.set_instance_transform(0,Transform3D(Basis.IDENTITY,centre+Vector3((i%10-5)*.05,0.,(i/10-5)*.05)))
		mm.set_instance_color(0,Color.WHITE);mm.set_instance_custom_data(0,Color(0,0,0,0))
		var node=MultiMeshInstance3D.new();node.multimesh=mm;node.extra_cull_margin=.5;warmup.add_child(node)
		warmed_variants+=1
	# An inland opening may contain no coast geometry at all. Still submit the
	# real beach/cliff and surf materials once, so their first draw is not deferred
	# until the player reaches a shoreline. These temporary planes remain covered.
	var coast_materials=0
	var terrain_materials=[world.base_material,world.context_node.material_override,world.regional_node.material_override]
	var surfaces=[]
	for key in ["alpine_surface","balkans_surface","anatolia_surface"]:
		if world.get(key)!=null:surfaces.append(world.get(key))
	if world.get("eastern_surfaces")!=null:surfaces.append_array(world.eastern_surfaces)
	for surface in surfaces:
		for key in ["material","detail_material","overview_material"]:
			var mat=surface.get(key)
			if mat is ShaderMaterial and not terrain_materials.has(mat):terrain_materials.append(mat)
	var terrain_mesh=terrain_sample(centre)
	for mat in terrain_materials:
		var node=MeshInstance3D.new();node.mesh=terrain_mesh;node.material_override=mat;node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;warmup.add_child(node)
	if world.get("coastal_focus")!=null:
		if world.coastal_focus.get("baseline")!=null and world.coastal_focus.baseline.ready:warmup.add_child(world.coastal_focus.baseline.warmup_node(centre))
		for source in [world.coastal_focus.beach,world.coastal_focus.surf]:
			var node=MeshInstance3D.new();var plane=PlaneMesh.new();plane.size=Vector2(.2,.2);node.mesh=plane;node.position=centre;node.material_override=source.material_override;node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;warmup.add_child(node);coast_materials+=1
	# Warm the reusable draw resources briefly, then remove the overlapping
	# samples. Keeping them rendered throughout generation only adds overdraw.
	for i in 6:await world.get_tree().process_frame
	await RenderingServer.frame_post_draw
	phases.append({"stage":"renderPipelines","ms":Time.get_ticks_msec()-start,"terrainMaterials":terrain_materials.size(),"coastMaterials":coast_materials,"baselineInstancing":coast_baseline_ready(world)})
	warmup.queue_free();await world.get_tree().process_frame
	await wait_for_view(loader,true)
	world.scenery.pin_startup_cells()
	if world.get("coastal_focus")!=null and world.coastal_focus.get("patch_key")!=null:world.coastal_focus.startup_pinned_key=world.coastal_focus.patch_key
	phases.append({"stage":"openingArea","ms":Time.get_ticks_msec()-start,"localCells":world.scenery.local_roots.size(),"coarseCells":world.scenery.roots.size()})
	loader.message.text="Restoring the opening campaign view"
	world.pitch=saved.pitch;world.yaw=saved.yaw
	world.view_pitch=saved.viewPitch;world.view_yaw=saved.viewYaw
	move_view(world,saved.focus,saved.distance)
	world.goal_focus=saved.goalFocus;world.goal_distance=saved.goalDistance
	await wait_for_view(loader)
	loader.metrics["startupPreparation"]={"warmedVariants":warmed_variants,"coastMaterials":coast_materials,"worldCoastChunks":coast_catalog.chunks.size() if coast_catalog!=null else 0,"worldCoastSourceBytes":coast_catalog.preloaded_bytes if coast_catalog!=null else 0,"worldCoastBaselineReady":coast_baseline_ready(world),"phases":phases,"elapsedMs":Time.get_ticks_msec()-start,"scope":"Worldwide coast baseline where enabled, existing terrain backdrops, shared resources and the opening view. Explicit legacy comparison flags retain their original coast renderer. High-resolution refinements remain bounded."}
	print("STARTUP_PREPARED ",JSON.stringify(loader.metrics.startupPreparation))
	loader.preparation_done=true
