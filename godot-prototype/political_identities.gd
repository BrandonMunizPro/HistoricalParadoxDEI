extends RefCounted
## Research identity, imperial relationships and territorial colour are separate.
var world
var catalog
var records=[]
var by_id={}
var research={}
var anchor_cache={}
var cached_revision=-1
var last_drawn={}
func _init(owner):
	world=owner;catalog=world.read_json("data/anatolia/political-identities-278.json")
	for r in world.research:research[r.proposedId]=r
	for raw in catalog.identities:
		assert(not by_id.has(raw.id) and research.has(raw.researchId))
		for key in ["factionId","overlordFactionId","associatedFactionId","provisionalSuzerainId"]:
			if raw.get(key)!=null:assert(world.political_map.factions.by_id.has(raw[key]))
		var r=raw.duplicate(true);var c=research[r.researchId].coordinates;r.geo=Vector2(c.lon,c.lat)
		records.append(r);by_id[r.id]=r
	records.sort_custom(func(a,b):return a.priority>b.priority)
func anchor(r):
	var revision=world.political_map.factions.overlay.anchor_revision
	if cached_revision!=revision:anchor_cache.clear();cached_revision=revision
	if r.get("anchorPolicy","")!="nearest_existing_owned_land":return r.geo
	if anchor_cache.has(r.id):return anchor_cache[r.id]
	var best=null;var score=INF
	# An existing controller-coloured land pixel, not an invented coastal province.
	for yy in range(-6,13):
		for xx in range(-10,11):
			var p=r.geo+Vector2(xx*.15,yy*.15)
			if world.anatolia_surface.owner_at(p)!=r.factionId or not world.anatolia_surface.land_at(p):continue
			var d=((p-r.geo)*Vector2(.8,1.)).length_squared()
			if d<score:score=d;best=p
	if best!=null:anchor_cache[r.id]=best
	return best
func control_id(r):
	var p=anchor(r)
	return world.anatolia_surface.owner_at(p) if p!=null else ""
func subtitle(r):
	if r.get("kind","")=="client_state" and r.get("overlordFactionId")!=null:return "Client of "+world.political_map.factions.by_id[r.overlordFactionId].name
	match r.relation:
		"seleucid_administration":
			var id=control_id(r)
			return world.political_map.factions.by_id[id].name+" administration" if id!="" else "Regional administration · control unresolved"
		"allegiance_uncertain":return "Ariarathid dynasts · allegiance uncertain"
		"coastal_possessions":return "Coastal holdings · extent provisional"
		"ptolemaic_association_attested":return "Ptolemaic ties attested · extent unresolved"
		"control_unresolved_278":return "Pamphylian polis · 278 control unresolved"
		"independent_with_external_alliances":return "Independent Rhodian state"
	return ""
func draw(labels):
	var drawn={};var sites={}
	last_drawn={}
	for r in records:
		if r.get("regionalOnly",false) and world.distance>450.:continue
		var geo=anchor(r)
		if geo==null:continue
		# Keep the researched city visible beside a regional/polity identity.
		# The city is a label anchor, not an implicitly approved regional capital.
		if r.kind!="polis" and r.get("anchorPolicy","")!="nearest_existing_owned_land":
			var site_name=research[r.researchId].historicalName
			if labels.label_at(site_name,r.geo,15,Color(.93,.93,.85),true):sites[site_name]=true
		var controller=control_id(r);var color=Color(.85,.84,.77)
		if controller!="":color=Color(world.political_map.factions.by_id[controller].color)
		if r.relation=="ptolemaic_association_attested":color=Color(world.political_map.factions.by_id[r.associatedFactionId].color)
		var faction=r.get("factionId","");faction="" if faction==null else faction
		for offset in [Vector2(0,-44),Vector2(0,42),Vector2(-110,0),Vector2(110,0),Vector2(0,-95),Vector2(0,95)]:
			if labels.label_at(r.name,geo,18,Color(.98,.91,.68),false,offset,faction,subtitle(r),color,r.get("monogram","")):
				last_drawn[r.id]=true
				if faction!="":drawn[faction]=true
				if r.kind=="polis":sites[research[r.researchId].historicalName]=true
				break
	return {"factions":drawn,"sites":sites}
func focus_identity(id):
	var r=by_id[id];world.goal_focus=r.geo;world.goal_distance=280.
	var controller=control_id(r);var c=world.political_map.factions.by_id[controller].name if controller!="" else "Unassigned in current territorial reconstruction"
	world.political_map.factions.detail.text=r.name+"\n"+subtitle(r)+"\nTerritorial colour: "+c+"\n"+r.confidence+"\n"+r.notes
