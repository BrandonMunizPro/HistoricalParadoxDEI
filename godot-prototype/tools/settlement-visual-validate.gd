extends SceneTree
const Model=preload("res://settlement_visual_state.gd")
const Composer=preload("res://settlement_visual_composition.gd")
var checks=0
var failures=[]
var water_limit=.4
func _initialize():call_deferred("run")
func check(value,message):
	checks+=1
	if not value:failures.append(message);push_error(message)
func read(name):return JSON.parse_string(FileAccess.get_file_as_string("res://data/settlement-visuals/"+name))
func flat(p):return {"land":p.x<water_limit,"height":.002}
func steep(p):return {"land":true,"height":p.x*.5+.1}
func no_land(_p):return {"land":false,"height":0.}
func stable(plan):
	var value=plan.duplicate(true);value.erase("timing");return JSON.stringify(value)
func run():
	var policy=read("profiles.json");var manifest=read("roman-assets.json");var fixtures=read("roman-fixtures.json");var assets={};var states=[];var plans=[]
	for asset in manifest.assets:assets[asset.id]=asset
	for fixture in fixtures.cases:
		var result=Model.resolve(fixture.input,policy);check(result.valid,"Resolve fixture "+fixture.caseId)
		var state=result.state;states.append(state);var profile=Model.profile(state,policy)
		water_limit=.4 if state.coastal else 10.
		var coasts=[{"point":Vector2(.4,0),"tangent":Vector2.DOWN,"water":Vector2.RIGHT,"sourceId":77}]
		var plan=await Composer.plan(state,profile,assets,Callable(self,"flat"),coasts)
		plans.append({"caseId":fixture.caseId,"pieces":plan.pieces.size(),"walls":plan.walls.pieces.size(),"wallValid":plan.walls.valid,"harborValid":plan.harbor.valid,"rejections":plan.rejected.size()})
		var repeat=await Composer.plan(state,profile,assets,Callable(self,"flat"),coasts)
		check(stable(plan)==stable(repeat),"Deterministic composition "+fixture.caseId)
		for i in plan.pieces.size():
			var piece=plan.pieces[i];check(piece.ground.valid,"Accepted terrain contact "+piece.id)
			for j in range(i+1,plan.pieces.size()):check(not Composer.rect(piece).intersects(Composer.rect(plan.pieces[j])),"No building overlap")
		if state.fortificationLevel>0:
			check(plan.walls.valid and plan.walls.gates.size()==2,"Complete connected enclosure "+fixture.caseId)
			for gate in plan.walls.gates:check(plan.roads.any(func(r):return r.gate==gate.id and (r.a.distance_to(gate.position)<.0001 or r.b.distance_to(gate.position)<.0001)),"Gate has a connected road")
		if state.portLevel>0:check(plan.harbor.valid and plan.harbor.requested,"Validated shore-attached harbor "+fixture.caseId)
		check(JSON.stringify(Model.decode(JSON.stringify(state)))==JSON.stringify(state),"Visual-only serialization round trip")
	var input=fixtures.cases[0].input.duplicate(true);input.architectureCulture="greek-hellenistic";input.erase("graphicalCultureOverride")
	check(Model.profile(Model.resolve(input,policy).state,policy).is_empty(),"Ownership does not Romanize a graphical culture")
	input.graphicalCultureOverride="roman_italic";check(not Model.profile(Model.resolve(input,policy).state,policy).is_empty(),"Explicit graphical-culture rule")
	input=fixtures.cases[0].input.duplicate(true);input.population=5000;var changed=Model.resolve(input,policy).state
	check(changed.populationBand==2,"Population band boundary")
	check(Model.changed_layers(states[0],changed)==["residential","roads","lod"],"Population refresh includes dependent access roads")
	var condition=states[0].duplicate(true);condition.damage="damaged";check(Model.changed_layers(states[0],condition)==["condition"],"Damage does not rebuild layout")
	var unsafe=fixtures.cases[0].input.duplicate(true);unsafe.portLevel=1;check(not Model.resolve(unsafe,policy).valid,"Reject inland sea port")
	check(Model.decode('{"schemaVersion":99}').is_empty(),"Reject incompatible visual save")
	check(Model.asset_path(assets["roman_italic.house_a"],0).status=="missing","Prototype cannot satisfy production gate")
	check(Model.asset_path(assets["roman_italic.house_a"],0,true).status=="development","Explicit development fallback")
	check(Model.asset_path(assets["roman_italic.gate"],0,true).status=="missing","Missing gate stays an asset gap")
	var rejected=await Composer.plan(states[0],Model.profile(states[0],policy),assets,Callable(self,"no_land"))
	check(rejected.pieces.is_empty() and not rejected.walls.valid,"Reject underwater buildings and broken wall ring")
	var slopes=await Composer.plan(states[0],Model.profile(states[0],policy),assets,Callable(self,"steep"))
	check(slopes.pieces.is_empty(),"Reject extreme-slope composition")
	check(not Composer.road_intersects(Rect2(Vector2(.8,.1),Vector2(.1,.1)),Vector2.ZERO,Vector2.ONE,.004),"Diagonal road bounding box does not reject unrelated parcels")
	check(Composer.road_intersects(Rect2(Vector2(.45,.45),Vector2(.1,.1)),Vector2.ZERO,Vector2.ONE,.004),"True road crossing rejected")
	water_limit=10.
	var strong=states[0].duplicate(true);strong.fortificationLevel=3
	var strengthened=await Composer.plan(strong,Model.profile(strong,policy),assets,Callable(self,"flat"))
	check(strengthened.walls.pieces.filter(func(p):return p.assetId.ends_with("tower")).size()>0,"Defense level adds authored tower slots")
	var narrow=states[3].duplicate(true);narrow.roadLevel=0
	var path=await Composer.plan(narrow,Model.profile(narrow,policy),assets,Callable(self,"flat"))
	check(path.roads[0].width<strengthened.roads[0].width,"Road level changes approach width")
	var dir="res://evidence/roman-settlement-slice";DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(dir))
	FileAccess.open(dir+"/headless.json",FileAccess.WRITE).store_string(JSON.stringify({"passed":failures.is_empty(),"checks":checks,"failures":failures,"states":states,"layerKeys":states.map(func(s):return Model.layer_keys(s)),"plans":plans},"  "))
	print("SETTLEMENT_VISUAL_VALIDATION ","PASS" if failures.is_empty() else failures," checks=",checks);quit(0 if failures.is_empty() else 1)
