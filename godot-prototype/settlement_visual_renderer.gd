extends RefCounted
## Adapter owned/ticked by SettlementPopulation. No separate map streamer.
const Model=preload("res://settlement_visual_state.gd")
const Composer=preload("res://settlement_visual_composition.gd")
const ROOT="res://data/settlement-visuals/"
var world
var policy
var assets={}
var fixtures
var entries={}
var contexts={}
var root:Node3D
var preview=false
var active=false
var preparing=false
var busy=false
var queue=[]
var resources={}
var requested={}
var samples={}
var fine_heights={}
var height_order=[]
var height_bytes=0
var height_budget=64*1024*1024
var height_tiles=[]
var coast_cells={}
var initialized=false
var current_center=Vector3.ZERO
var cached_bytes=0
var mesh_budget=96*1024*1024
var mesh_order=[]
var caption
var stats={"productionReady":false,"productionAssets":0,"missingAssets":0,"registered":0,"baselines":0,"generationMs":0.,"maxGenerationChunkMs":0.,"attachMs":0.,"assetWaitMs":0.,"cacheHits":0,"cacheMisses":0,"cachedBytes":0,"rebuilds":0,"lodSwitches":0,"missingRoles":{},"development":false}
func read(name):return JSON.parse_string(FileAccess.get_file_as_string(ROOT+name))
func _init(owner):
	world=owner;policy=read("profiles.json");fixtures=read("roman-fixtures.json")
	for asset in read("roman-assets.json").assets:
		assets[asset.id]=asset
		if Model.asset_path(asset,3).status=="production":stats.productionAssets+=1
		else:stats.missingAssets+=1
	stats.productionReady=stats.missingAssets==0
	preview=OS.get_cmdline_user_args().has("--settlement-visual-slice");stats.development=preview
	root=Node3D.new();root.name="SettlementVisualPipeline";world.add_child(root)
	active=preview or stats.productionReady
	if preview:
		for fixture in fixtures.cases:register_input(fixture.input)
		var layer=CanvasLayer.new();layer.layer=20;world.add_child(layer)
		caption=Label.new();caption.position=Vector2(24,148);caption.text="ROMAN VISUAL PIPELINE · DEVELOPMENT ASSETS · production architecture missing";caption.add_theme_color_override("font_color",Color("ffd994"));caption.add_theme_color_override("font_shadow_color",Color.BLACK);caption.add_theme_constant_override("shadow_offset_x",2);caption.add_theme_constant_override("shadow_offset_y",2);layer.add_child(caption)
	world.set_meta("settlement_visual_pipeline",self)
func bind_development(model):
	var id=model.settlement.settlementId
	if not contexts.has(id):
		var s=model.settlement
		contexts[id]={"settlementId":id,"architectureCulture":s.architectureCulture,"rank":"city" if s.class=="major" else "rural","population":null,"prosperity":null,"capital":false,"terrain":"river" if "freshwater" in s.terrain else "plain","coastal":"coastal" in s.terrain,"portLevel":0,"fortificationLevel":0,"roadLevel":0,"buildings":[],"monuments":[],"construction":"none","damage":"intact"}
	var callback=Callable(self,"development_changed").bind(model)
	if not model.changed.is_connected(callback):model.changed.connect(callback)
	development_changed(model)
func development_changed(model):
	var input=Model.development_input(contexts[model.settlement.settlementId],model)
	for building in input.buildings:
		if building.chain=="port":input.portLevel=building.level
		if building.chain=="walls":input.fortificationLevel=building.level
	register_input(input)
func register_input(input):
	var site={}
	for s in world.sites:
		if s.id==input.settlementId:site=s;break
	if site.is_empty():return {"valid":false,"errors":["unknown_canonical_anchor"]}
	var result=Model.resolve(input,policy)
	if not result.valid:return result
	var state=result.state;var id=state.settlementId;var old=entries.get(id,{});var changed=Model.changed_layers(old.get("state",{}),state)
	contexts[id]=input.duplicate(true)
	if changed.is_empty():return result
	var entry=old
	if entry.is_empty():entry={"site":site,"baseline":null,"node":null,"lod":3,"plan":{},"revision":0,"pendingLayers":[]}
	entry.state=state;entry.revision+=1
	for key in changed:
		if not key in entry.pendingLayers:entry.pendingLayers.append(key)
	entries[id]=entry;stats.registered=entries.size()
	if active and not preparing and not id in queue:queue.append(id)
	return result
func owns(id):return active and entries.has(id) and entries[id].baseline!=null
func is_ready():return not active or (initialized and not preparing and not busy and stats.baselines==entries.size())
func pause_frame():await world.get_tree().process_frame
func source_height(geo):
	# Reuse source height grids, never generate/deform terrain for a city.
	for surface in world.eastern_surfaces:
		if surface.weight(geo)>.001:return surface.sample_height(geo,true)
	var best={};var best_span=INF
	for descriptor in height_tiles:
		if descriptor.get("romaDetail",false) or descriptor.kind=="context":continue
		var b=descriptor.bounds
		if geo.x<b.west or geo.x>b.east or geo.y<b.south or geo.y>b.north:continue
		var span=b.east-b.west
		if span<best_span:best=descriptor;best_span=span
	if not best.is_empty():
		if not fine_heights.has(best.id):
			var data=FileAccess.get_file_as_bytes("res://"+best.heights).to_float32_array();var bytes=data.size()*4
			while height_bytes+bytes>height_budget and not height_order.is_empty():
				var old=height_order.pop_front();height_bytes-=fine_heights[old].size()*4;fine_heights.erase(old)
			if bytes>height_budget:return world.sample_entry({"descriptor":best,"heights":data,"reveal":1.},geo.x,geo.y)
			fine_heights[best.id]=data;height_bytes+=bytes
		height_order.erase(best.id);height_order.append(best.id)
		return world.sample_entry({"descriptor":best,"heights":fine_heights[best.id],"reveal":1.},geo.x,geo.y)
	return world.elevation(geo.x,geo.y)
func sample(point):
	if samples.has(point):return samples[point]
	var p=current_center+Vector3(point.x,0,point.y);var geo=world.unproject(p)
	var land=world.is_land(geo.x,geo.y);var height=source_height(geo)
	if world.coastal_focus!=null:
		var coast=placement_coast_sample(geo,Vector2(p.x,p.z))
		if coast!=null:
			# Placement uses the physical shoreline, not vegetation's beach setback.
			land=coast.distance>.0002;height=world.coastal_focus.profile_sample_height(coast)
	var result={"land":land,"height":height};samples[point]=result;return result
func placement_coast_sample(geo,point):
	var coast=world.coastal_focus
	if coast.local_contains(point):return coast.coastal_sample(geo.x,geo.y)
	# Decode indexed source segments once per local cell. Catalog.segment also
	# maintains a streaming LRU; repeating that for every contact sample is costly.
	var key=Vector2i(floori(point.x),floori(point.y))
	if not coast_cells.has(key):
		var rows=[]
		for id in coast.catalog.ids_at(point):rows.append(coast.catalog.segment(id))
		coast_cells[key]=rows
	var best=.22;var result=null
	for row in coast_cells[key]:
		var a=Vector2(row[0],row[1]);var delta=Vector2(row[2],row[3])-a
		var closest=a+delta*clamp((point-a).dot(delta)/delta.length_squared(),0.,1.)
		var offset=point-closest;var d=offset.length()
		if d<best:
			best=d;result={"point":point,"distance":d*sign(offset.dot(Vector2(row[4],row[5]))),"beach":row[8],"rock":row[9]}
	return result
func coast_candidates(site,maximum_m):
	var coast=world.coastal_focus
	if coast==null or coast.get("catalog")==null:return []
	var center=world.project(site.lon,site.lat);var ids={};var radius=float(maximum_m)*.001
	for y in range(floori(center.z-radius),ceili(center.z+radius)+1):
		for x in range(floori(center.x-radius),ceili(center.x+radius)+1):
			for id in coast.catalog.ids_at(Vector2(x,y)):ids[id]=true
	var candidates=[]
	for id in ids:
		var s=coast.catalog.segment(id);var a=Vector2(s[0],s[1]);var b=Vector2(s[2],s[3]);var delta=b-a
		var point=a+delta*clamp((Vector2(center.x,center.z)-a).dot(delta)/delta.length_squared(),0.,1.)
		if point.distance_to(Vector2(center.x,center.z))<=radius:candidates.append({"point":point-Vector2(center.x,center.z),"tangent":delta.normalized(),"water":-Vector2(s[4],s[5]),"sourceId":int(id)})
	candidates.sort_custom(func(a,b):return a.point.length_squared()<b.point.length_squared())
	if candidates.size()<=48:return candidates
	# A dense rocky inlet must not consume every candidate before a nearby
	# usable shoreline is considered. Keep nearest priority plus spatial reach.
	var selected=candidates.slice(0,12)
	for i in 36:selected.append(candidates[12+int(float(i)*(candidates.size()-13)/35.)])
	return selected
func prepare_baselines(tree):
	if not active or preparing:return
	preparing=true
	for id in entries:
		await rebuild(id,3,true)
		await tree.process_frame
	preparing=false;initialized=true;queue.clear();stats.baselines=entries.values().filter(func(e):return e.baseline!=null).size()
	print("SETTLEMENT_BASELINES_READY ",JSON.stringify(stats))
func lod_for(distance,previous):
	var limits=[2.5,15.,160.];var target=0
	for limit in limits:
		if distance>=limit:target+=1
	if previous>=0 and previous!=target:
		var boundary=limits[mini(previous,target)]
		if abs(distance-boundary)<boundary*.08:return previous
	return target
func tick():
	if not active or preparing or not initialized:return
	for id in entries:
		var entry=entries[id]
		if entry.baseline==null:
			if not id in queue:queue.append(id)
			continue
		var point=world.project(entry.site.lon,entry.site.lat);var separation=Vector2(point.x-world.target.x,point.z-world.target.z).length()
		var lod=lod_for(max(world.distance,separation),entry.lod)
		if lod!=entry.lod and not id in queue:queue.append(id)
		entry["wantedLod"]=lod
		var label=entry.baseline.get_meta("label");label.visible=lod==3 or int(entry.get("render",{}).get("groups",0))==0
		label.pixel_size=max(.00004,world.distance*.00010)
		label.position.y=world.elevation(entry.site.lon,entry.site.lat)+world.distance*.0015
	if not busy and not queue.is_empty():
		var id=queue.pop_front();rebuild(id,int(entries[id].get("wantedLod",3)),entries[id].baseline==null)
func mesh_for(path):
	if resources.has(path):stats.cacheHits+=1;mesh_order.erase(path);mesh_order.append(path);return resources[path].parts
	stats.cacheMisses+=1;var start=Time.get_ticks_msec()
	if not requested.has(path):
		if ResourceLoader.load_threaded_request(path)!=OK:return []
		requested[path]=true
	while ResourceLoader.load_threaded_get_status(path)==ResourceLoader.THREAD_LOAD_IN_PROGRESS:
		if Time.get_ticks_msec()-start>10000:return []
		await pause_frame()
	if ResourceLoader.load_threaded_get_status(path)!=ResourceLoader.THREAD_LOAD_LOADED:return []
	var resource=ResourceLoader.load_threaded_get(path);requested.erase(path);var parts=[]
	if resource is Mesh:parts.append({"mesh":resource,"transform":Transform3D.IDENTITY})
	elif resource is PackedScene:
		var scene=resource.instantiate();collect_meshes(scene,Transform3D.IDENTITY,parts);scene.free()
	var bytes=0
	var full_bounds=AABB();var first=true
	for part in parts:
		var bounds=part.transform*part.mesh.get_aabb()
		full_bounds=bounds if first else full_bounds.merge(bounds);first=false
	for part in parts:
		part["assetBounds"]=full_bounds
		for surface in part.mesh.get_surface_count():bytes+=part.mesh.surface_get_array_len(surface)*80+part.mesh.surface_get_array_index_len(surface)*4
	while cached_bytes+bytes>mesh_budget and not mesh_order.is_empty():
		var old=mesh_order.pop_front();cached_bytes-=resources[old].bytes;resources.erase(old)
	if bytes<=mesh_budget:resources[path]={"parts":parts,"bytes":bytes};mesh_order.append(path);cached_bytes+=bytes
	stats.cachedBytes=cached_bytes;stats.assetWaitMs+=Time.get_ticks_msec()-start
	return parts
func collect_meshes(node,transform,parts):
	if node is Node3D:transform=transform*node.transform
	if node is MeshInstance3D and node.mesh!=null:
		var mesh=node.mesh
		for i in mesh.get_surface_count():
			if node.get_surface_override_material(i)!=null:
				if mesh==node.mesh:mesh=mesh.duplicate()
				mesh.surface_set_material(i,node.get_surface_override_material(i))
		parts.append({"mesh":mesh,"transform":transform,"override":node.material_override})
	for child in node.get_children():collect_meshes(child,transform,parts)
func baseline_node(entry):
	var node=Node3D.new();node.name="RetainedSettlementBaseline";var p=world.project(entry.site.lon,entry.site.lat)
	var label=Label3D.new();label.position=Vector3(p.x,world.elevation(entry.site.lon,entry.site.lat),p.z);label.billboard=BaseMaterial3D.BILLBOARD_ENABLED;label.no_depth_test=false;label.font_size=24
	var glyph={"rural":"·","town":"⌂","city":"▤","major":"▣","capital":"▲"}.get(entry.state.rank,"·")
	label.text=glyph+" "+entry.site.name+(" ⚑" if entry.state.fortificationLevel>0 else "")+(" ⚓" if entry.state.portLevel>0 else "")
	label.modulate=Color("e7d1a1");label.outline_size=6;node.add_child(label);node.set_meta("label",label);root.add_child(node)
	return node
func diagnostics(node,entry,plan):
	if not preview:return
	var mesh=ImmediateMesh.new();var material=StandardMaterial3D.new();material.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED;material.albedo_color=Color("c9b37a")
	mesh.surface_begin(Mesh.PRIMITIVE_LINES,material);var count=0;var center=world.project(entry.site.lon,entry.site.lat)
	for road in plan.roads:
		var steps=maxi(1,ceili(road.a.distance_to(road.b)/.006))
		for i in steps:
			for point in [road.a.lerp(road.b,float(i)/steps),road.a.lerp(road.b,float(i+1)/steps)]:mesh.surface_add_vertex(center+Vector3(point.x,sample(point).height+.00035,point.y));count+=1
	if plan.harbor.get("requested",false) and plan.harbor.valid:
		var shore=plan.harbor.shore;var water=plan.harbor.water;var tangent=plan.harbor.tangent
		for pair in [[shore-tangent*.018,shore+tangent*.018],[shore,shore+water*.065]]:
			for point in pair:mesh.surface_add_vertex(center+Vector3(point.x,.001,point.y));count+=1
	if count==0:mesh.surface_add_vertex(center);mesh.surface_add_vertex(center)
	mesh.surface_end();var line=MeshInstance3D.new();line.name="DevelopmentPlanNotAuthoredRoadOrQuay";line.mesh=mesh;line.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;node.add_child(line)
func rebuild(id,lod,initial=false):
	if not entries.has(id):return
	busy=true;var entry=entries[id];var revision=entry.revision;var state=entry.state;var profile=Model.profile(state,policy)
	if entry.baseline==null:entry.baseline=baseline_node(entry);stats.baselines+=1
	if profile.is_empty():
		if entry.node!=null:entry.node.queue_free();entry.node=null
		entry.baseline.get_meta("label").text=entry.site.name+" · graphical profile unavailable";entry.pendingLayers.clear();busy=false;return
	current_center=world.project(entry.site.lon,entry.site.lat);samples.clear();coast_cells.clear()
	# The catalog contains thousands of unrelated descriptors. Filter once per
	# settlement, not once per 5m contact sample. Keep every intersecting source.
	height_tiles.clear()
	var margin=.08
	for descriptor in world.tiles.values():
		var b=descriptor.bounds
		if entry.site.lon+margin>=b.west and entry.site.lon-margin<=b.east and entry.site.lat+margin>=b.south and entry.site.lat-margin<=b.north:height_tiles.append(descriptor)
	var dirty=entry.pendingLayers.duplicate()
	if dirty==["condition"] and entry.node!=null:
		entry.node.set_meta("damage",state.damage);entry.node.set_meta("construction",state.construction)
		entry["lastRefreshLayers"]=dirty;entry.pendingLayers.clear();entry["conditionAssetsMissing"]=true;busy=false;return
	if entry.plan.is_empty() or not entry.pendingLayers.is_empty():
		var coasts=coast_candidates(entry.site,profile.harborSearchM) if state.portLevel>0 else []
		var plan=await Composer.plan(state,profile,assets,Callable(self,"sample"),coasts,Callable(self,"pause_frame"))
		if revision!=entries[id].revision:busy=false;return
		entry.plan=plan
		stats.generationMs+=entry.plan.timing.activeMs;stats.maxGenerationChunkMs=max(stats.maxGenerationChunkMs,entry.plan.timing.longestChunkMs)
		entry["lastRefreshLayers"]=entry.pendingLayers.duplicate();entry.pendingLayers.clear();stats.rebuilds+=1
	if revision!=entries[id].revision:busy=false;return
	var rebuild_all=initial or entry.node==null or lod!=entry.lod
	var refreshed=["residential","districts","fortifications","harbor","roads"] if rebuild_all else dirty
	var staging=Node3D.new();staging.name="ComposedSettlementLOD%d"%lod
	var started=Time.get_ticks_usec();var groups={};var records=entry.plan.pieces+entry.plan.walls.pieces+entry.plan.harbor.pieces;var missing={};var triangles=0
	for road in entry.plan.roads:
		var count=maxi(1,ceili(road.a.distance_to(road.b)/.004))
		for i in count:
			var a=road.a.lerp(road.b,float(i)/count);var b=road.a.lerp(road.b,float(i+1)/count);var p=(a+b)*.5
			records.append({"id":road.id+"_%d"%i,"assetId":profile.assetPrefix+"road","position":p,"angle":atan2((b-a).x,(b-a).y),"footprint":Vector2(road.width,a.distance_to(b)),"length":a.distance_to(b),"width":road.width,"pitch":atan2(sample(b).height-sample(a).height,a.distance_to(b)),"layer":"roads","ground":sample(p)})
	if lod==3:
		records=[{"id":"city_hlod","assetId":profile.assetPrefix+"hlod_"+state.rank,"position":Vector2.ZERO,"angle":0.,"footprint":Vector2.ONE*float(entry.plan.radiusM)*.002,"ground":sample(Vector2.ZERO),"layer":"residential"}]+entry.plan.walls.pieces+entry.plan.harbor.pieces
	if lod<4:
		for record in records:
			if not record.layer in refreshed:continue
			var asset=assets.get(record.assetId,{})
			if asset.is_empty():continue
			var resolution=Model.asset_path(asset,lod,preview and lod<3)
			if resolution.status=="missing":missing[record.assetId]=true;continue
			var parts=await mesh_for(resolution.path)
			var units=.001 if asset.units=="metres" else 1.
			for index in parts.size():
				var part=parts[index];var bounds=part.assetBounds;var center=bounds.get_center();var ground=record.ground.get("low",record.ground.get("height",0.))
				# Fixed asset-unit conversion; city rank never scales architecture.
				var basis=Basis(Vector3.UP,record.angle).scaled(Vector3.ONE*units)
				if record.has("pitch"):basis=Basis(Vector3.UP,record.angle)*Basis(Vector3.RIGHT,-record.pitch).scaled(Vector3.ONE*units)
				if record.has("length") and bounds.size.z>0:basis=basis*Basis.from_scale(Vector3(1,1,record.length/(bounds.size.z*units)))
				if record.has("width") and bounds.size.x>0:basis=basis*Basis.from_scale(Vector3(record.width/(bounds.size.x*units),1,1))
				var position=current_center+Vector3(record.position.x,ground,record.position.y)-basis*Vector3(center.x,bounds.position.y,center.z)
				var transform=Transform3D(basis,position)*part.transform
				var key=record.layer+"/"+resolution.path+"/"+str(index)
				if not groups.has(key):groups[key]={"mesh":part.mesh,"transforms":[],"layer":record.layer,"override":part.get("override")}
				groups[key].transforms.append(transform)
		for key in groups:
			var group=groups[key];var mm=MultiMesh.new();mm.transform_format=MultiMesh.TRANSFORM_3D;mm.mesh=group.mesh;mm.instance_count=group.transforms.size()
			for i in group.transforms.size():mm.set_instance_transform(i,group.transforms[i])
			var layer=staging.get_node_or_null("layer_"+group.layer)
			if layer==null:layer=Node3D.new();layer.name="layer_"+group.layer;staging.add_child(layer)
			var child=MultiMeshInstance3D.new();child.multimesh=mm;child.material_override=group.override;child.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_ON if lod==0 else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF;layer.add_child(child)
			for surface in group.mesh.get_surface_count():triangles+=group.mesh.surface_get_array_index_len(surface)/3*group.transforms.size()
			await pause_frame()
		if preview and lod<3 and "roads" in refreshed:
			var layer=Node3D.new();layer.name="layer_roads";staging.add_child(layer);diagnostics(layer,entry,entry.plan)
	if revision!=entries[id].revision:staging.free();busy=false;return
	root.add_child(staging)
	if entry.node!=null and not rebuild_all:
		for layer in entry.node.get_children():
			if not str(layer.name).trim_prefix("layer_") in refreshed:layer.reparent(staging)
	# Baseline stays until the replacement has participated in a render frame.
	await pause_frame()
	if entry.node!=null:entry.node.queue_free()
	entry.node=staging;entry.lod=lod;stats.lodSwitches+=1
	var all_groups=0
	for layer in staging.get_children():
		for child in layer.get_children():
			if child is MultiMeshInstance3D:all_groups+=1
	entry["render"]={"lod":lod,"groups":all_groups,"trianglesBuilt":triangles,"missing":missing.keys(),"development":preview,"wallValid":entry.plan.walls.valid,"portValid":entry.plan.harbor.valid,"pieces":records.size(),"refreshedLayers":refreshed}
	for key in missing:stats.missingRoles[key]=true
	stats.attachMs+=(Time.get_ticks_usec()-started)/1000.;busy=false
func snapshot():
	var result=stats.duplicate(true);result.heightCacheBytes=height_bytes;result.entries={}
	for id in entries:
		var e=entries[id];result.entries[id]={"site":e.site.key,"state":e.state,"render":e.get("render",{}),"baselineReady":e.baseline!=null,"refreshLayers":e.get("lastRefreshLayers",[]),"plan":{"rejected":e.plan.get("rejected",[]),"harbor":e.plan.get("harbor",{}).get("reason",""),"harborRejected":e.plan.get("harbor",{}).get("rejected",{}),"walls":e.plan.get("walls",{}).get("reason",""),"acceptedPieces":e.plan.get("pieces",[]).size()}}
	return result
