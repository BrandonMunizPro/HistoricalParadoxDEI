extends SceneTree
const Planner=preload("res://settlement_composition.gd")
func read(path):return JSON.parse_string(FileAccess.get_file_as_string("res://"+path))
func _initialize():call_deferred("run")
func flat(_p):return {"land":true,"height":.025}
func sea(p):return {"land":p.x<.1,"height":.025}
func steep(p):return {"land":true,"height":.025+p.x*.3}
func bump(p):return {"land":true,"height":.035 if p.length()<.003 else .025}
func run():
	var catalog=read("data/settlement-composition-catalog.json");var definition=read("data/neapolis-composition.json")
	var first=await Planner.plan(catalog,definition,Callable(self,"flat"));var second=await Planner.plan(catalog,definition,Callable(self,"flat"))
	first.erase("timing");second.erase("timing")
	assert(var_to_bytes(first)==var_to_bytes(second),"Composition must be deterministic")
	assert(first.buildings.size()>=35 and first.buildings.size()<60)
	assert(first.agoraValid and first.connectedJunctions==25 and first.roads.size()==40)
	var categories={};var kinds={}
	for building in first.buildings:
		assert(building.category==catalog.archetypes[building.archetype].category)
		assert(building.tier==1 and building.culture==definition.culture)
		assert(building.requirements.has("land") and building.requirements.has("street_access"))
		categories[building.category]=true;kinds[building.archetype]=true
		for prior in first.buildings:
			if prior.id!=building.id:assert(not Planner.bounds(prior).grow(.00099).intersects(Planner.bounds(building).grow(.00099)),"Overlapping footprints")
		for road in first.roads:assert(not Planner.bounds(building).intersects(Planner.ribbon_bounds(road.a,road.b,road.width)))
		var access=first.paths.filter(func(p):return p.id==building.access)
		assert(access.size()==1 and first.roads.any(func(r):return r.id==access[0].road))
		for other in first.buildings:
			if other.id!=building.id:assert(not Planner.bounds(other).intersects(Planner.ribbon_bounds(access[0].a,access[0].b,access[0].width)))
	assert(categories.size()==5 and kinds.size()>=9)
	for asset in catalog.archetypes.values():
		for path in [asset.near,asset.far]:
			var mesh=load(path);assert(mesh is ArrayMesh)
			var box=mesh.get_aabb();var half=Planner.v(asset.footprintM)*.0005
			assert(box.position.x>=-half.x-.00001 and box.end.x<=half.x+.00001,"Asset exceeds declared width: "+path)
			assert(box.position.z>=-half.y-.00001 and box.end.z<=half.y+.00001,"Asset exceeds declared depth: "+path)
	var coast=await Planner.plan(catalog,definition,Callable(self,"sea"))
	assert(coast.buildings.size()<first.buildings.size())
	for building in coast.buildings:
		for p in Planner.corner_points(building):assert(sea(p).land)
	var slope=await Planner.plan(catalog,definition,Callable(self,"steep"));assert(slope.buildings.is_empty())
	var probe={"position":Vector2.ZERO,"footprint":Vector2(.024,.024),"angle":0.}
	assert(not Planner.contact(probe,Callable(self,"bump"),catalog.placement).valid,"Interior terrain spike must be rejected")
	var collision=definition.duplicate(true);collision.landmarks.append(collision.landmarks[0].duplicate(true));collision.landmarks[-1].id="overlap_probe"
	var collision_plan=await Planner.plan(catalog,collision,Callable(self,"flat"))
	assert(collision_plan.rejected.any(func(r):return r.id=="overlap_probe" and r.reason in ["building_overlap","access_overlap","blocked_access"]))
	# A differently named cultural asset family must not require renderer edits.
	var alternative=catalog.duplicate(true);var alternate_layout=definition.duplicate(true)
	alternative.archetypes["alternate_court"]=alternative.archetypes.court_a;alternative.archetypes.erase("court_a")
	alternative.cultures["alternate_family"]={};alternate_layout.culture="alternate_family"
	alternate_layout.residentialArchetypes[0]="alternate_court"
	var alternate_plan=await Planner.plan(alternative,alternate_layout,Callable(self,"flat"))
	assert(alternate_plan.buildings.all(func(b):return b.culture=="alternate_family"))
	assert(alternate_plan.buildings.any(func(b):return b.archetype=="alternate_court"))
	assert(alternate_plan.buildings.size()==first.buildings.size())
	var report={"passed":true,"deterministic":true,"reusableAlternateCulture":true,"buildings":first.buildings.size(),"categories":categories.keys(),"archetypes":kinds.keys(),"connectedJunctions":first.connectedJunctions,"roads":first.roads.size(),"accessPaths":first.paths.size(),"coastAccepted":coast.buildings.size(),"steepAccepted":slope.buildings.size(),"rejectedOnFlat":first.rejected,"footprintsAndMeshesChecked":true}
	FileAccess.open("res://evidence/neapolis-composition/composition-tests.json",FileAccess.WRITE).store_string(JSON.stringify(report,"  "))
	print("NEAPOLIS_COMPOSITION_TEST_OK ",JSON.stringify(report));quit()
