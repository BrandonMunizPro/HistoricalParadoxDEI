extends RefCounted
## Disposable development-preview state; never writes research or campaign state.
signal changed
var catalog:Dictionary
var settlement:Dictionary
var levels={}
var last_error=""
func _init(c:Dictionary,s:Dictionary):
	catalog=c;settlement=s.duplicate(true);reset(false)
func reset(emit=true):
	levels.clear()
	for slot in settlement.slots:
		if slot.building!=null:levels[slot.id]=int(slot.building.startingLevel)
	if emit:changed.emit()
func chain(id):
	for b in catalog.chains:
		if b.id==id:return b
	return {}
func slot_by_id(id):
	for s in settlement.slots:
		if s.id==id:return s
	return {}
func eligibility(id):
	var b=chain(id);var reasons=[]
	if b.is_empty():return ["Unknown building chain"]
	if not settlement.architectureCulture in b.cultures:reasons.append("Architectural culture")
	if settlement.yearBce>b.fromBce or settlement.yearBce<b.toBce:reasons.append("Historical period")
	for tag in b.terrain:
		if not tag in settlement.terrain:reasons.append("Terrain: "+tag)
	for mineral in b.deposits:
		var found=false
		for deposit in settlement.deposits:
			if deposit.mineral==mineral and not deposit.evidence.is_empty():found=true
		if not found:reasons.append("Evidenced deposit: "+mineral)
	if b.technology!=null:
		var valid=false
		for t in catalog.technologies:
			if t.id==b.technology and t.id in settlement.technologies and settlement.architectureCulture in t.cultures and settlement.yearBce<=t.fromBce and settlement.yearBce>=t.toBce:valid=true
		if not valid:reasons.append("Attested technology")
	if b.infrastructure=="water-route":
		var valid=false
		for route in settlement.waterRoutes:
			if route.sourceEvidence.is_empty() or route.pointsM.size()<2:continue
			var downhill=true
			for i in range(1,route.pointsM.size()):
				var a=route.pointsM[i-1];var p=route.pointsM[i]
				if a[1]<=p[1] or Vector2(a[0],a[2]).distance_to(Vector2(p[0],p[2]))<=0:downhill=false
			if downhill:valid=true
		if not valid:reasons.append("Surveyed downhill water route")
	return reasons
func resolve_visual(chain_id,level):
	var b=chain(chain_id)
	if b.is_empty() or level<1 or level>3 or not eligibility(chain_id).is_empty():return {}
	var key=b.levels[level-1].visualKey;var fallback={}
	for a in catalog.visuals:
		if a.visualKey!=key or a.culture!=settlement.architectureCulture:continue
		if a.regionalStyle==settlement.regionalStyle:
			return a if ResourceLoader.exists(a.near) and ResourceLoader.exists(a.far) else {}
		if a.regionalStyle=="default":fallback=a
	return fallback if not fallback.is_empty() and ResourceLoader.exists(fallback.near) and ResourceLoader.exists(fallback.far) else {}
func set_level(id,level):
	last_error="";var slot=slot_by_id(id)
	if slot.is_empty() or slot.building==null or level<1 or level>3 or level!=int(level):last_error="Select an occupied slot and level I–III";return false
	if not eligibility(slot.building.chain).is_empty():last_error="Prerequisites not met";return false
	# Missing art never destroys the supplied state; renderer shows a labelled gap.
	levels[id]=int(level);changed.emit();return true
func effect_references(id):
	var slot=slot_by_id(id);var result={"buildingEffects":[],"landmarkModifiers":[]}
	if slot.is_empty() or slot.building==null:return result
	var b=chain(slot.building.chain);var level=levels[id]
	if b.is_empty() or not eligibility(b.id).is_empty():return result
	result.buildingEffects=b.levels[level-1].effects.duplicate()
	for l in catalog.landmarks:
		if l.id==slot.building.landmark and l.chain==b.id and settlement.settlementId in l.settlementIds and level>=l.minimumLevel:result.landmarkModifiers=l.modifiers.duplicate()
	return result
func validate(known_ids):
	var errors=[];var capacity=0
	for c in catalog.classes:
		if c.id==settlement.class:capacity=int(c.slots)
	if capacity==0 or settlement.slots.size()!=capacity:errors.append("Slot capacity")
	if not settlement.settlementId in known_ids:errors.append("Unknown settlement")
	var ids=[];var landmarks=[]
	for slot in settlement.slots:
		if slot.id in ids:errors.append("Duplicate slot")
		ids.append(slot.id)
		if slot.building==null:continue
		var b=chain(slot.building.chain)
		if b.is_empty():errors.append("Unknown chain");continue
		if slot.building.startingLevel<1 or slot.building.startingLevel>3 or slot.building.startingLevel!=int(slot.building.startingLevel):errors.append("Starting level")
		if slot.building.evidence.is_empty():errors.append("Missing starting evidence")
		if not slot.allowedCategories.is_empty() and not b.category in slot.allowedCategories:errors.append("Slot category")
		errors.append_array(eligibility(b.id))
		if slot.building.landmark!=null:
			var found=false
			for l in catalog.landmarks:
				if l.id==slot.building.landmark and l.chain==b.id and settlement.settlementId in l.settlementIds and slot.building.startingLevel>=l.minimumLevel:found=true
			if not found or slot.building.landmark in landmarks:errors.append("Landmark restriction")
			landmarks.append(slot.building.landmark)
	return errors
