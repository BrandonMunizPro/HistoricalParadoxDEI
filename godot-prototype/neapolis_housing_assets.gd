extends RefCounted
## Mesh grouping adapter only. Population selection and layout stay in their owner.
const ROOT="res://assets/neapolis-free/"
var meshes={}
var catalog={}
func _init():
	for row in JSON.parse_string(FileAccess.get_file_as_string(ROOT+"assemblies.json")).assemblies:
		catalog[row.path]=row
		assert(ResourceLoader.load_threaded_request(row.path)==OK)
func _notification(what):
	if what==NOTIFICATION_PREDELETE:
		# Release requests for an LOD the player never visited. Godot retains a
		# completed threaded request until its result has been collected.
		for path in catalog:
			if not meshes.has(path) and ResourceLoader.load_threaded_get_status(path) in [ResourceLoader.THREAD_LOAD_IN_PROGRESS,ResourceLoader.THREAD_LOAD_LOADED]:ResourceLoader.load_threaded_get(path)
func get_mesh(variant,far,world):
	var path=ROOT+"house-%d%s.res"%[variant,"-far" if far else ""]
	if not meshes.has(path):
		while ResourceLoader.load_threaded_get_status(path)==ResourceLoader.THREAD_LOAD_IN_PROGRESS:await world.get_tree().process_frame
		assert(ResourceLoader.load_threaded_get_status(path)==ResourceLoader.THREAD_LOAD_LOADED,"Residential asset failed to load")
		meshes[path]=ResourceLoader.load_threaded_get(path)
	return meshes[path]
func attach(node,world,far):
	var started=Time.get_ticks_usec()
	var active=0;var longest=0;var asset_wait=0;var chunk=started
	var baseline=node.multimesh;var groups=[[],[],[]];var colors=[[],[],[]];var all_slots=[]
	for i in baseline.instance_count:
		var original=baseline.get_instance_transform(i);all_slots.append(original);all_slots.append(baseline.get_instance_color(i))
		if original.basis.determinant()==0:continue
		var variant=posmod(("neapolis|slot:%d"%i).hash(),3)
		var old_size=original.basis.get_scale();var scale_x=old_size.x/.022;var scale_z=old_size.z/.0224
		# Keep the slot's centre and horizontal envelope, with architectural height
		# proportional to its footprint, rather than a unit-house box's height.
		var basis=original.basis*Basis.from_scale(Vector3(1./.022,min(scale_x,scale_z)/old_size.y,1./.0224))
		# Terrain placement belongs to the existing population renderer. Preserve
		# its complete origin rather than introducing a second height sampler.
		groups[variant].append(Transform3D(basis,original.origin));colors[variant].append(baseline.get_instance_color(i))
	var elapsed=Time.get_ticks_usec()-chunk;active+=elapsed;longest=max(longest,elapsed)
	var total=0;var submissions=0;var unique=0
	for variant in 3:
		if groups[variant].is_empty():continue
		var waiting=Time.get_ticks_usec();var mesh=await get_mesh(variant,far,world);asset_wait+=Time.get_ticks_usec()-waiting;chunk=Time.get_ticks_usec()
		var mm=MultiMesh.new();mm.transform_format=MultiMesh.TRANSFORM_3D;mm.use_colors=true;mm.mesh=mesh;mm.instance_count=groups[variant].size()
		for i in groups[variant].size():mm.set_instance_transform(i,groups[variant][i]);mm.set_instance_color(i,colors[variant][i])
		var child=MultiMeshInstance3D.new();child.name="ResidentialAssembly%d"%variant;child.multimesh=mm;child.cast_shadow=node.cast_shadow;node.add_child(child)
		var triangles=int(catalog[mesh.resource_path].triangles)
		total+=triangles*mm.instance_count;unique+=triangles;submissions+=mesh.get_surface_count()
		elapsed=Time.get_ticks_usec()-chunk;active+=elapsed;longest=max(longest,elapsed)
		# Stay inside the population renderer's asynchronous construction path.
		# The original node remains visible until all replacement groups are ready.
		await world.get_tree().process_frame
	baseline.visible_instance_count=0
	node.set_meta("neapolis_geometry",{"assemblies":3,"detail":"far" if far else "near","instancedTriangles":total,"uniqueTriangles":unique,"mainPassSurfaceGroups":submissions,"instanceCounts":groups.map(func(g):return g.size()),"foundationNotice":"Original slot origins and terrain sampling preserved. Foundation skirts retained; no terrain flattening. Live contact inspection remains necessary.","attachActiveCpuMs":active/1000.,"longestActiveChunkMs":longest/1000.,"assetWaitMs":asset_wait/1000.,"attachWallMs":(Time.get_ticks_usec()-started)/1000.})
	node.set_meta("neapolis_slot_hash",var_to_bytes(all_slots).hex_encode().sha256_text())
