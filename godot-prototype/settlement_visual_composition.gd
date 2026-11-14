extends RefCounted
## Compose registered assets. Never constructs an architectural mesh.
const State=preload("res://settlement_visual_state.gd")
const Contact=preload("res://settlement_composition.gd")
static func rect(record):return Contact.bounds(record)
static func rotate(p,angle):return Vector2(cos(angle)*p.x+sin(angle)*p.y,-sin(angle)*p.x+cos(angle)*p.y)
static func asset_id(profile,role,variant=0,rank=""):
	var options=profile.get("rankRoles",{}).get(rank,{}).get(role,profile.roles.get(role,[]))
	return profile.assetPrefix+str(options[variant%options.size()]) if not options.is_empty() else ""
static func geometry_policy(profile):return {"sampleSpacingM":5.,"maxReliefM":profile.maxReliefM,"maxGrade":profile.maxGrade,"clearanceM":4.}
static func district_for(weights,index,count):
	var total=0.
	for key in State.DISTRICTS:total+=weights[key]
	if total<=0:return "civic"
	var target=(float(index)+.5)/maxi(1,count)*total;var cumulative=0.
	for key in State.DISTRICTS:
		cumulative+=weights[key]
		if target<=cumulative:return key
	return "civic"
static func route(a,b,width,sampler,policy):
	if a.distance_to(b)<.001:return [a,b]
	var options=[[a,b],[a,Vector2(a.x,b.y),b],[a,Vector2(b.x,a.y),b]]
	for option in options:
		var valid=true
		for i in range(1,option.size()):
			if option[i-1].distance_to(option[i])>.0001 and not Contact.road_valid(option[i-1],option[i],width,sampler,policy):valid=false;break
		if valid:return option
	return []
static func segment_distance(p,a,b):
	var delta=b-a
	return p.distance_to(a+delta*clamp((p-a).dot(delta)/max(.00000001,delta.length_squared()),0.,1.))
static func road_intersects(bounds,a,b,width):
	# A diagonal road's axis-aligned bounding box can cover half a settlement.
	# Clip its centreline to the expanded parcel instead of rejecting that box.
	var box=bounds.grow(width*.5);var delta=b-a;var low=0.;var high=1.
	for axis in 2:
		if abs(delta[axis])<.00000001:
			if a[axis]<box.position[axis] or a[axis]>box.end[axis]:return false
		else:
			var u=(box.position[axis]-a[axis])/delta[axis];var v=(box.end[axis]-a[axis])/delta[axis]
			low=max(low,min(u,v));high=min(high,max(u,v))
			if low>high:return false
	return true
static func wall_plan(boundary,gates,level,sampler,policy,prefix):
	var result={"valid":true,"pieces":[],"gates":gates,"reason":""}
	if level==0:return result
	for i in boundary.size():
		var a=boundary[i];var b=boundary[(i+1)%boundary.size()];var intervals=[[0.,1.]]
		for gate in gates:
			if gate.edge!=i:continue
			var half=.006/a.distance_to(b);intervals=[[0.,.5-half],[.5+half,1.]]
		for interval in intervals:
			var start=a.lerp(b,interval[0]);var end=a.lerp(b,interval[1]);var steps=maxi(1,ceili(start.distance_to(end)/.018))
			for j in steps:
				var p=start.lerp(end,(float(j)+.5)/steps);var angle=atan2((b-a).x,(b-a).y)
				var piece={"id":"wall_%d_%d_%d"%[i,int(interval[0]*1000),j],"assetId":prefix+"wall","position":p,"angle":angle,"footprint":Vector2(.004,start.distance_to(end)/steps),"category":"fortifications","layer":"fortifications","length":start.distance_to(end)/steps}
				var ground=Contact.contact(piece,sampler,policy)
				if not ground.valid:return {"valid":false,"pieces":[],"gates":gates,"reason":"wall_terrain"}
				piece.ground=ground;result.pieces.append(piece)
		result.pieces.append({"id":"corner_%d"%i,"assetId":prefix+"wall_corner","position":a,"angle":0.,"footprint":Vector2(.006,.006),"category":"fortifications","layer":"fortifications","ground":sampler.call(a)})
		# Stronger defenses add authored towers, never scale the wall mesh.
		if level>=2:
			var towers=1 if level==2 else 2
			for tower in towers:
				var p=a.lerp(b,float(tower+1)/float(towers+1))
				if gates.any(func(g):return g.position.distance_to(p)<.012):continue
				var record={"id":"tower_%d_%d"%[i,tower],"assetId":prefix+"tower","position":p,"angle":atan2((b-a).x,(b-a).y),"footprint":Vector2(.008,.008),"layer":"fortifications"}
				var ground=Contact.contact(record,sampler,policy)
				if not ground.valid:return {"valid":false,"pieces":[],"gates":gates,"reason":"tower_terrain"}
				record.ground=ground;result.pieces.append(record)
	for gate in gates:result.pieces.append({"id":gate.id,"assetId":prefix+"gate","position":gate.position,"angle":gate.angle,"footprint":Vector2(.012,.008),"category":"fortifications","layer":"fortifications","ground":sampler.call(gate.position)})
	return result
static func harbor(state,profile,candidates,sampler,roads,gates,policy):
	if state.portLevel==0:return {"valid":true,"requested":false,"pieces":[],"roads":[]}
	if not state.coastal:return {"valid":false,"requested":true,"pieces":[],"roads":[],"reason":"inland_port"}
	var rejected={}
	for coast in candidates:
		var point=coast.point;var tangent=coast.tangent.normalized();var water=coast.water.normalized()
		if point.length()*1000.>profile.harborSearchM:continue
		if abs(tangent.dot(water))>.1:continue
		var angle=atan2(tangent.x,tangent.y);var warehouse=point-water*.070
		var parts=[{"id":"harbor_quay","assetId":profile.assetPrefix+"quay","position":point-water*.010,"footprint":Vector2(.012,.032),"angle":angle,"domain":"land"},{"id":"harbor_warehouse","assetId":profile.assetPrefix+"warehouse","position":warehouse,"footprint":Vector2(.025,.038),"angle":angle,"domain":"land"},{"id":"harbor_jetty","assetId":profile.assetPrefix+"jetty","position":point+water*.030,"footprint":Vector2(.006,.070),"angle":atan2(water.x,water.y),"domain":"shore_crossing"}]
		for level in range(1,state.portLevel):
			parts.append({"id":"harbor_store_%d"%level,"assetId":profile.assetPrefix+("maritime_store" if level==1 else "waterfront_market"),"position":warehouse+tangent*.050*level,"footprint":Vector2(.025,.038),"angle":angle,"domain":"land"})
		var valid=true
		for part in parts:
			if part.domain=="land":
				var contact_policy=policy.duplicate()
				# A quay is shoreline infrastructure with a graded land socket.
				if part.id=="harbor_quay":contact_policy.maxReliefM=1.2
				var ground=Contact.contact(part,sampler,contact_policy)
				if not ground.valid:
					var reason=part.id+":"+ground.reason;rejected[reason]=rejected.get(reason,0)+1;valid=false;break
				part.ground=ground
			else:
				if sampler.call(point+water*.055).land or not sampler.call(point-water*.006).land:valid=false;break
				part.ground={"low":0.,"height":0.}
		if not valid:continue
		var connection=Vector2.ZERO;var gate_id="civic"
		if state.fortificationLevel>0:
			if gates.is_empty():continue
			var best=INF
			for gate in gates:
				if gate.position.distance_to(warehouse)<best:best=gate.position.distance_to(warehouse);connection=gate.position;gate_id=gate.id
		var path=route(connection,warehouse,.005,sampler,policy)
		if path.is_empty():rejected["road_terrain"]=rejected.get("road_terrain",0)+1;continue
		var added=[]
		for i in range(1,path.size()):added.append({"id":"harbor_road_%d"%i,"a":path[i-1],"b":path[i],"width":.005,"gate":gate_id,"layer":"roads"})
		for part in parts:part.category="harbor";part.layer="harbor"
		return {"valid":true,"requested":true,"sourceId":coast.sourceId,"shore":point,"tangent":tangent,"water":water,"pieces":parts,"roads":added,"connectionGate":gate_id,"reason":""}
	return {"valid":false,"requested":true,"pieces":[],"roads":[],"reason":"no_valid_shore_and_land_connection","rejected":rejected,"candidates":candidates.size()}
static func plan(state,profile,assets,sampler,coasts=[],pause=Callable()):
	var started=Time.get_ticks_usec();var chunk=started;var active_us=0;var longest_us=0
	var rank=profile.ranks[state.rank];var radius=float(rank.radiusM)*.001
	var density=float(rank.defaultDensity)
	if state.populationBand!=null:density*=.65+float(state.populationBand)*.12
	if state.prosperityBand!=null:density*=.9+float(state.prosperityBand)*.05
	var rng=RandomNumberGenerator.new();rng.seed=state.seed
	var yaw=rng.randf_range(-.16,.16);var boundary=PackedVector2Array()
	for p in profile.boundary:boundary.append(rotate(Vector2(p[0],p[1])*radius,yaw))
	var policy=geometry_policy(profile);var roads=[];var gates=[];var pieces=[];var rejected=[];var occupied=[]
	var road_width=.003+state.roadLevel*.001
	var gate_edges=[1,4]
	if state.portLevel>0 and not coasts.is_empty():
		var nearest=INF;var selected=1
		for edge in boundary.size():
			var middle=(boundary[edge]+boundary[(edge+1)%boundary.size()])*.5
			if middle.distance_to(coasts[0].point)<nearest:nearest=middle.distance_to(coasts[0].point);selected=edge
		gate_edges=[selected,(selected+3)%boundary.size()]
	for edge in gate_edges:
		var p=(boundary[edge]+boundary[(edge+1)%boundary.size()])*.5
		var tangent=(boundary[(edge+1)%boundary.size()]-boundary[edge]).normalized();var outward=Vector2(-tangent.y,tangent.x)
		if outward.dot(p)<0:outward=-outward
		var gate={"id":"gate_%d"%edge,"position":p,"edge":edge,"angle":atan2(outward.x,outward.y),"outward":outward}
		var path=route(Vector2.ZERO,p,road_width,sampler,policy)
		if path.is_empty():rejected.append({"id":gate.id,"reason":"approach_terrain"});continue
		gates.append(gate)
		for i in range(1,path.size()):roads.append({"id":gate.id+"_%d"%i,"a":path[i-1],"b":path[i],"width":road_width,"gate":gate.id,"layer":"roads"})
	var walls=wall_plan(boundary,gates,state.fortificationLevel,sampler,policy,profile.assetPrefix)
	if state.fortificationLevel>0 and gates.size()!=2:walls={"valid":false,"pieces":[],"gates":gates,"reason":"unconnected_gates"}
	var port=harbor(state,profile,coasts,sampler,roads,gates,policy)
	for road in port.roads:roads.append(road)
	# Reserve land-side harbor parcels before placing housing.
	if port.valid:
		for part in port.pieces:
			if part.get("domain","")=="land":occupied.append(rect(part).grow(.002))
	# Authored landmark parcels remain reserved even if their art is absent.
	# Adding a named landmark therefore cannot displace an unrelated district.
	for id in profile.get("monumentSlots",{}):
		var slot=profile.monumentSlots[id]
		if not state.settlementId in slot.settlementIds:continue
		var position=Vector2(slot.anchorM[0],slot.anchorM[1])*.001;var footprint=Vector2(slot.footprintM[0],slot.footprintM[1])*.001
		occupied.append(Rect2(position-footprint*.5,footprint).grow(.002))
		if id in state.monuments:
			var record={"id":id,"assetId":slot.assetId,"position":position,"angle":0.,"footprint":footprint,"category":"landmark","layer":"districts"}
			var ground=Contact.contact(record,sampler,policy)
			if ground.valid:record.ground=ground;pieces.append(record)
			else:rejected.append({"id":id,"reason":"landmark_terrain"})
	var total=int(ceil(rank.residentialClusters*density))+int(rank.districtSlots)+int(rank.landmarks)
	var district_parcel=min(.050,radius*.3)
	var residential_target=int(ceil(rank.residentialClusters*density));var districts_count=int(rank.districtSlots)
	var placed_count=0
	var completed_slots={}
	for i in total*12:
		# Rejected candidates must yield too; continue paths used to skip this.
		if pause.is_valid() and Time.get_ticks_usec()-chunk>2500:
			var elapsed=Time.get_ticks_usec()-chunk;active_us+=elapsed;longest_us=max(longest_us,elapsed);await pause.call();chunk=Time.get_ticks_usec()
		if placed_count>=total:break
		# A temple that cannot fit must not starve every later residential slot.
		var slot=int(i/12)
		if completed_slots.has(slot):continue
		var category="residential";var layer="residential";var parcel=.025 if state.rank in ["rural","town"] else .046
		if slot<districts_count:category=district_for(state.weights,slot,districts_count);layer="districts";parcel=district_parcel
		elif slot>=districts_count+residential_target:category="religious" if slot%2 else "civic";layer="districts";parcel=district_parcel
		var angle=float(i)*2.399963229728653+rng.randf_range(-.12,.12);var r=radius*(.20+.52*sqrt(float(i%maxi(1,total))/maxi(1,total)))
		var p=rotate(Vector2(cos(angle),sin(angle))*r,yaw)
		var nearest=Contact.nearest_road(p,roads)
		if nearest.is_empty():rejected.append({"id":"parcel_%d"%i,"reason":"no_street"});continue
		var direction=nearest.point-p;var heading=atan2(direction.x,direction.y)
		var id=asset_id(profile,category,slot,state.rank)
		if id=="":continue
		var asset=assets[id];var footprint=Vector2(asset.footprintM[0],asset.footprintM[1])*.001
		# Parcel changes invalidate dependent housing/access, never other cities.
		var reserve=Vector2.ONE*max(parcel,max(footprint.x,footprint.y))
		var piece={"id":"parcel_%d"%slot,"assetId":id,"position":p,"angle":heading,"footprint":reserve,"assetFootprint":footprint,"category":category,"layer":layer}
		var bounds=rect(piece).grow(.002);var reason=""
		for point in [bounds.position,bounds.end,Vector2(bounds.end.x,bounds.position.y),Vector2(bounds.position.x,bounds.end.y)]:
			if not Geometry2D.is_point_in_polygon(point,boundary):reason="outside_settlement"
		for road in roads:
			if road_intersects(bounds,road.a,road.b,road.width+.004):reason="road_overlap";break
		for prior in occupied:
			if bounds.intersects(prior):reason="building_overlap";break
		var ground={}
		if reason=="":ground=Contact.contact(piece,sampler,policy);reason="" if ground.valid else ground.reason
		# Access starts at the parcel boundary and ends at a connected road.
		var half=bounds.size*.5;var factor=min(half.x/max(abs(direction.x),.000001),half.y/max(abs(direction.y),.000001))
		var connected_gate=""
		for road in roads:
			if road.id==nearest.road:connected_gate=road.get("gate","");break
		var entrance=p+direction*factor;var access={"id":piece.id+"_access","a":entrance,"b":nearest.point,"width":.0025,"layer":"roads","gate":connected_gate}
		if reason=="" and entrance.distance_to(nearest.point)<.001:reason="no_access_clearance"
		if reason=="" and not Contact.road_valid(entrance,nearest.point,.0025,sampler,policy):reason="access_terrain"
		for prior in occupied:
			if road_intersects(prior,entrance,nearest.point,.003):reason="blocked_access";break
		if reason=="":piece.ground=ground;piece.access=access.id;pieces.append(piece);occupied.append(bounds);roads.append(access);placed_count+=1;completed_slots[slot]=true
		else:rejected.append({"id":"candidate_%d"%i,"reason":reason})
		if pause.is_valid() and Time.get_ticks_usec()-chunk>2500:
			var elapsed=Time.get_ticks_usec()-chunk;active_us+=elapsed;longest_us=max(longest_us,elapsed);await pause.call();chunk=Time.get_ticks_usec()
	# Harbor warehouses/roads may not pass through the composed town.
	if port.get("requested",false) and port.valid:
		var conflict=false
		for road in port.roads:
			for piece in pieces:
				if road_intersects(rect(piece),road.a,road.b,road.width):conflict=true
		if conflict:
			roads=roads.filter(func(r):return not str(r.id).begins_with("harbor_road"));port={"valid":false,"requested":true,"pieces":[],"roads":[],"reason":"harbor_route_conflict"}
	var elapsed=Time.get_ticks_usec()-chunk;active_us+=elapsed;longest_us=max(longest_us,elapsed)
	return {"version":1,"state":state,"radiusM":rank.radiusM,"boundary":boundary,"pieces":pieces,"roads":roads,"walls":walls,"harbor":port,"rejected":rejected,"targetPieces":total,"timing":{"activeMs":active_us/1000.,"longestChunkMs":longest_us/1000.,"wallMs":(Time.get_ticks_usec()-started)/1000.}}
