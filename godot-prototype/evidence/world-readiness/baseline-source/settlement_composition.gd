extends RefCounted
## Pure composition and footprint policy. No rendering, simulation or site edits.
## The sampler accepts a local Vector2 in km and returns {land, height in km}.
static func v(value):return Vector2(value[0],value[1])
static func bounds(record):
	var half=record.footprint*.5;var a=record.angle
	var extent=Vector2(abs(cos(a))*half.x+abs(sin(a))*half.y,abs(sin(a))*half.x+abs(cos(a))*half.y)
	return Rect2(record.position-extent,extent*2.)
static func corner_points(record,spacing=.005):
	var points=[record.position];var size=record.footprint
	var nx=maxi(1,ceili(size.x/spacing));var nz=maxi(1,ceili(size.y/spacing))
	for x in nx+1:
		for z in nz+1:
			var p=Vector2((float(x)/nx-.5)*size.x,(float(z)/nz-.5)*size.y)
			# Godot's Y rotation maps local X/Z in this direction.
			points.append(record.position+Vector2(cos(record.angle)*p.x+sin(record.angle)*p.y,-sin(record.angle)*p.x+cos(record.angle)*p.y))
	return points
static func contact(record,sampler,policy):
	var low=INF;var high=-INF;var samples=[]
	for p in corner_points(record,float(policy.sampleSpacingM)*.001):
		var s=sampler.call(p)
		if not s.land or not is_finite(s.height):return {"valid":false,"reason":"water_or_invalid_height"}
		low=min(low,s.height);high=max(high,s.height);samples.append({"point":p,"height":s.height})
	if high-low>float(policy.maxReliefM)*.001:return {"valid":false,"reason":"terrain_relief","low":low,"high":high}
	# Compare neighbouring samples, not just the mean rise across the building.
	var nz=maxi(1,ceili(record.footprint.y/(float(policy.sampleSpacingM)*.001)))
	for i in samples.size():
		var neighbours=[]
		if i==0:
			for j in range(1,samples.size()):
				if samples[0].point.distance_to(samples[j].point)<=float(policy.sampleSpacingM)*.0015:neighbours.append(j)
		else:
			if (i-1)%(nz+1)<nz:neighbours.append(i+1)
			if i+nz+1<samples.size():neighbours.append(i+nz+1)
			if (i-1)%(nz+1)<nz and i+nz+2<samples.size():neighbours.append(i+nz+2)
			if (i-1)%(nz+1)>0 and i+nz<samples.size():neighbours.append(i+nz)
		for j in neighbours:
			var distance=samples[i].point.distance_to(samples[j].point)
			if distance>0 and distance<=float(policy.sampleSpacingM)*.0015 and abs(samples[i].height-samples[j].height)/distance>float(policy.maxGrade):return {"valid":false,"reason":"slope"}
	return {"valid":true,"low":low,"height":high,"sampleCount":samples.size()}
static func ribbon_bounds(a,b,width):return Rect2(a.min(b)-Vector2.ONE*width*.5,(a-b).abs()+Vector2.ONE*width)
static func nearest_road(point,roads,facing=null):
	var best={};var distance=INF
	for road in roads:
		var delta=road.b-road.a;var p=road.a+delta*clamp((point-road.a).dot(delta)/delta.length_squared(),0.,1.)
		if facing!=null and (p-point).normalized().dot(facing)<.9:continue
		if point.distance_to(p)<distance:
			distance=point.distance_to(p);best={"point":p,"road":road.id,"distance":distance}
	return best
static func road_valid(a,b,width,sampler,policy):
	var normal=Vector2(-(b-a).y,(b-a).x).normalized()*width*.5
	var steps=maxi(1,ceili(a.distance_to(b)/.004));var prior=[]
	for i in steps+1:
		var p=a.lerp(b,float(i)/steps);var heights=[]
		for offset in [-normal,Vector2.ZERO,normal]:
			var s=sampler.call(p+offset)
			if not s.land or not is_finite(s.height):return false
			heights.append(s.height)
		if abs(heights[0]-heights[2])/width>float(policy.maxGrade):return false
		if not prior.is_empty():
			for j in 3:
				if abs(heights[j]-prior[j])/(a.distance_to(b)/steps)>float(policy.maxGrade):return false
		prior=heights
	return true
static func plan(catalog,definition,sampler,pause=Callable()):
	var policy=catalog.placement;var roads=[];var rejected=[];var buildings=[];var paths=[]
	var chunk=Time.get_ticks_usec();var active_us=0;var longest_us=0
	var xs=definition.streetX;var zs=definition.streetZ;var junctions={}
	for x in xs.size():
		for z in zs.size():junctions["%d:%d"%[x,z]]=Vector2(xs[x],zs[z])
	for x in xs.size():
		for z in zs.size():
			for step in [Vector2i(1,0),Vector2i(0,1)]:
				if x+step.x>=xs.size() or z+step.y>=zs.size():continue
				var from="%d:%d"%[x,z];var to="%d:%d"%[x+step.x,z+step.y]
				var a=junctions[from];var b=junctions[to]
				var width=(.009 if z in [1,2,3] else .003) if step.x else (.0045 if x in [1,2,3] else .003)
				if road_valid(a,b,width,sampler,policy):roads.append({"id":from+"-"+to,"from":from,"to":to,"a":a,"b":b,"width":width,"category":"infrastructure","archetype":"street","tier":1})
				if pause.is_valid() and Time.get_ticks_usec()-chunk>2000:
					var elapsed=Time.get_ticks_usec()-chunk;active_us+=elapsed;longest_us=max(longest_us,elapsed)
					await pause.call();chunk=Time.get_ticks_usec()
	# Retain only the street component connected to the civic centre.
	var origin="";var origin_distance=INF
	for id in junctions:
		var distance=junctions[id].distance_to(v(definition.agora.center))
		if distance<origin_distance:origin=id;origin_distance=distance
	var connected={origin:true};var changed=true
	while changed:
		changed=false
		for road in roads:
			if connected.has(road.from) and not connected.has(road.to):connected[road.to]=true;changed=true
			if connected.has(road.to) and not connected.has(road.from):connected[road.from]=true;changed=true
	roads=roads.filter(func(r):return connected.has(r.from) and connected.has(r.to))
	var agora={"position":v(definition.agora.center),"footprint":v(definition.agora.size),"angle":0.,"category":"infrastructure","archetype":"agora","tier":1}
	# Draped public surfaces need no level plinth; keep the slope/land checks.
	var surface_policy=policy.duplicate();surface_policy.maxReliefM=1000.;surface_policy.sampleSpacingM=10.
	var agora_contact=contact(agora,sampler,surface_policy)
	if pause.is_valid():
		var elapsed=Time.get_ticks_usec()-chunk;active_us+=elapsed;longest_us=max(longest_us,elapsed)
		await pause.call();chunk=Time.get_ticks_usec()
	var candidates=definition.landmarks.duplicate(true)
	var rng=RandomNumberGenerator.new();rng.seed=int(definition.seed)
	for district in definition.neighborhoods:
		for i in definition.parcelOffsets.size():
			var position=v(district.center)+v(definition.parcelOffsets[i])
			var kind=definition.residentialArchetypes[rng.randi_range(0,definition.residentialArchetypes.size()-1)]
			kind=district.get("archetypeOverrides",{}).get(str(i),kind)
			var scale_range=definition.residentialScaleRange if catalog.archetypes[kind].category=="residential" else definition.serviceScaleRange
			candidates.append({"id":district.id+"_%d"%i,"archetype":kind,"position":[position.x,position.y],"angle":null,"scale":rng.randf_range(scale_range[0],scale_range[1]),"district":district.id,"requirements":[]})
	for candidate in candidates:
		if pause.is_valid() and Time.get_ticks_usec()-chunk>2000:
			var elapsed=Time.get_ticks_usec()-chunk;active_us+=elapsed;longest_us=max(longest_us,elapsed)
			await pause.call();chunk=Time.get_ticks_usec()
		var asset=catalog.archetypes[candidate.archetype];var p=v(candidate.position)
		var facing=Vector2(sin(candidate.angle),cos(candidate.angle)) if candidate.angle!=null else null
		var nearest=nearest_road(p,roads,facing)
		if nearest.is_empty():rejected.append({"id":candidate.id,"reason":"no_connected_street"});continue
		var direction=nearest.point-p
		var angle=float(candidate.angle) if candidate.angle!=null else atan2(direction.x,direction.y)
		var record={"id":candidate.id,"archetype":candidate.archetype,"category":asset.category,"tier":int(asset.get("tier",1)),"culture":definition.culture,"position":p,"angle":angle,"scale":float(candidate.scale),"footprint":v(asset.footprintM)*.001*float(candidate.scale),"district":candidate.district,"requirements":asset.requires.duplicate(),"near":asset.near,"far":asset.far,"tint":Color.from_hsv(.08+rng.randf_range(-.008,.008),rng.randf_range(.04,.13),rng.randf_range(.88,1.0))}
		var reason="";var rect=bounds(record);var padded=rect.grow(float(policy.clearanceM)*.0005)
		for requirement in ["agora_edge","precinct","approach"]:
			if asset.requires.has(requirement) and not candidate.requirements.has(requirement):reason="missing_placement_context"
		if asset.requires.has("agora_edge") and not bounds(agora).grow(.08).has_point(p):reason="outside_agora_district"
		for road in roads:
			if padded.intersects(ribbon_bounds(road.a,road.b,road.width)):reason="street_overlap";break
		if agora_contact.valid and padded.intersects(bounds(agora)):reason="agora_overlap"
		for prior in buildings:
			if padded.intersects(bounds(prior).grow(float(policy.clearanceM)*.0005)):reason="building_overlap";break
		for path in paths:
			if padded.intersects(ribbon_bounds(path.a,path.b,path.width)):reason="access_overlap";break
		# An orthogonal access lane begins at the parcel boundary, not its centre.
		var extent=rect.size*.5
		var factor=min(extent.x/max(abs(direction.x),.0000001),extent.y/max(abs(direction.y),.0000001))
		var entrance=p+direction*factor
		var path={"id":candidate.id+"_access","a":entrance,"b":nearest.point,"width":.003,"road":nearest.road,"category":"infrastructure","archetype":"path","tier":1}
		if path.a.distance_to(path.b)<.001:reason="no_access_clearance"
		for prior in buildings:
			if bounds(prior).grow(.001).intersects(ribbon_bounds(path.a,path.b,path.width)):reason="blocked_access";break
		if reason=="" and not road_valid(path.a,path.b,path.width,sampler,policy):reason="invalid_access_terrain"
		var building_policy=policy.duplicate()
		if asset.category in ["civic","religious"]:building_policy.maxReliefM=policy.publicMaxReliefM
		var ground=contact(record,sampler,building_policy) if reason=="" else {"valid":false}
		if reason=="" and not ground.valid:reason=ground.reason
		if reason!="":rejected.append({"id":candidate.id,"reason":reason});continue
		record["ground"]=ground;record["access"]=path.id
		buildings.append(record);paths.append(path)
	var elapsed=Time.get_ticks_usec()-chunk;active_us+=elapsed;longest_us=max(longest_us,elapsed)
	return {"version":1,"culture":definition.culture,"buildings":buildings,"roads":roads,"paths":paths,"agora":agora,"agoraValid":agora_contact.valid,"rejected":rejected,"connectedJunctions":connected.size(),"seed":definition.seed,"timing":{"activeMs":active_us/1000.,"longestChunkMs":longest_us/1000.}}
