extends RefCounted
## Pure read-model projection; shares policy data with the TypeScript contract.
const DISTRICTS=["commercial","military","religious","civic","agricultural"]
const RANKS=["rural","town","city","major","capital"]
const LAYERS=["layout","residential","districts","fortifications","harbor","roads","condition","lod"]
static func visual_seed(id):
	var hash=2166136261
	for i in id.length():hash=((hash^id.unicode_at(i))*16777619)&0xffffffff
	return hash
static func band(value,limits):
	if value==null:return null
	var result=0
	for limit in limits:
		if value>=limit:result+=1
	return result
static func valid_level(value):return (value is int or value is float) and is_finite(value) and value==int(value) and value>=0 and value<=3
static func resolve(input,policy):
	var errors=[]
	if input.get("settlementId","")=="" or not input.get("rank","") in RANKS:errors.append("identity_or_rank")
	for key in ["population","prosperity"]:
		var value=input.get(key)
		if value!=null and (not (value is int or value is float) or not is_finite(value) or value<0):errors.append("demographics")
	for key in ["portLevel","fortificationLevel","roadLevel"]:
		if not valid_level(input.get(key,-1)):errors.append("infrastructure")
	if not input.get("coastal",false) and input.get("portLevel",0)>0:errors.append("inland_port")
	if not input.get("terrain","") in ["plain","hill","river"] or not input.get("damage","") in ["intact","damaged","ruined"] or not input.get("construction","") in ["none","building"]:errors.append("context")
	if input.has("seed") and (not (input.seed is int or input.seed is float) or input.seed<0 or input.seed>4294967295 or input.seed!=int(input.seed)):errors.append("seed")
	var weights={}
	for district in DISTRICTS:weights[district]=0.
	for building in input.get("buildings",[]):
		if building.get("chain","")=="" or not valid_level(building.get("level",0)) or building.get("level",0)<1 or not building.get("condition","") in ["active","ruined"]:errors.append("building");continue
		if building.condition=="ruined":continue
		for district in DISTRICTS:weights[district]+=float(policy.chainWeights.get(building.chain,{}).get(district,0))*building.level
	for district in DISTRICTS:weights[district]=round(weights[district]*1000.)/1000.
	if not errors.is_empty():return {"valid":false,"errors":errors}
	var culture=input.get("graphicalCultureOverride")
	if culture==null:culture=policy.cultureAliases.get(input.architectureCulture,input.architectureCulture)
	var monuments=[]
	for id in input.get("monuments",[]):
		if id=="":return {"valid":false,"errors":["monument"]}
		if not id in monuments:monuments.append(id)
	monuments.sort()
	return {"valid":true,"errors":[],"state":{"schemaVersion":1,"settlementId":input.settlementId,"graphicalCultureId":culture,"rank":input.rank,"populationBand":band(input.get("population"),policy.populationBands),"prosperityBand":band(input.get("prosperity"),policy.prosperityBands),"capital":input.capital,"terrain":input.terrain,"coastal":input.coastal,"portLevel":int(input.portLevel),"fortificationLevel":int(input.fortificationLevel),"roadLevel":int(input.roadLevel),"weights":weights,"monuments":monuments,"construction":input.construction,"damage":input.damage,"seed":int(input.get("seed",visual_seed(input.settlementId)))}}
static func profile(state,policy):
	var family=policy.cultures.get(state.graphicalCultureId,{})
	if family.get("status")!="implemented":return {}
	return policy.profiles.get(family.profile,{})
static func layer_keys(s):
	var layout="%s|%s|%d|%s"%[s.graphicalCultureId,s.rank,int(s.seed),s.terrain]
	var population=str(int(s.populationBand)) if s.populationBand!=null else "unknown"
	var prosperity=str(int(s.prosperityBand)) if s.prosperityBand!=null else "unknown"
	var weights=[]
	for district in DISTRICTS:weights.append(str(roundi(s.weights[district]*1000.)))
	var special="|".join(weights+s.monuments+[str(s.capital)])
	var parcels=layout+"|%d|%s"%[s.roadLevel,s.coastal and s.portLevel>0]
	return {"layout":layout,"residential":parcels+"|"+population+"|"+prosperity+"|"+special,"districts":parcels+"|"+special,"fortifications":layout+"|"+str(int(s.fortificationLevel))+"|"+str(s.coastal and s.portLevel>0),"harbor":layout+"|"+str(s.coastal)+"|"+str(int(s.portLevel))+"|"+str(int(s.fortificationLevel)),"roads":layout+"|%d|%d|%s|%d|"%[s.roadLevel,s.fortificationLevel,s.coastal,s.portLevel]+population+"|"+prosperity+"|"+special,"condition":s.damage+"|"+s.construction,"lod":layout+"|"+population+"|"+prosperity+"|%d|%d|"%[s.fortificationLevel,s.portLevel]+special}
static func changed_layers(previous,next):
	if previous.is_empty():return LAYERS.duplicate()
	var before=layer_keys(previous);var after=layer_keys(next);var changed=[]
	for key in LAYERS:
		if before[key]!=after[key]:changed.append(key)
	return changed
static func development_input(context,model):
	var input=context.duplicate(true);input.settlementId=model.settlement.settlementId;input.architectureCulture=model.settlement.architectureCulture;input.buildings=[]
	for slot in model.settlement.slots:
		if slot.building!=null:input.buildings.append({"chain":slot.building.chain,"level":model.levels[slot.id],"condition":"active"})
	return input
static func asset_path(asset,lod,allow_development=false):
	if asset.get("quality")=="production" and asset.get("periodReviewed",false) and asset.get("uvReviewed",false) and asset.get("normalsReviewed",false) and asset.get("pbrReviewed",false) and asset.fromBce>=278 and asset.toBce<=278:
		var valid=asset.authoredSource!=null and asset.licenseEvidence!=null and FileAccess.file_exists(asset.authoredSource) and FileAccess.file_exists(asset.licenseEvidence)
		valid=valid and asset.lods.size()==4 and asset.units in ["metres","kilometres"]
		if asset.authoredSource!=null:valid=valid and asset.authoredSource.get_extension().to_lower() in ["glb","gltf","blend","fbx","obj"]
		for path in asset.lods:
			if path==null or not ResourceLoader.exists(path):valid=false
		if valid:return {"status":"production","path":asset.lods[lod]}
	if allow_development and asset.get("development")!=null:
		var path=asset.development.near if lod==0 else asset.development.far
		if ResourceLoader.exists(path):return {"status":"development","path":path}
	return {"status":"missing","path":"","reason":"authored_production_asset_required"}
static func decode(text):
	var value=JSON.parse_string(text)
	if not value is Dictionary or value.get("schemaVersion")!=1 or not value.get("rank","") in RANKS:return {}
	for key in ["portLevel","fortificationLevel","roadLevel"]:
		if not valid_level(value.get(key,-1)):return {}
	for key in ["populationBand","prosperityBand"]:
		var b=value.get(key)
		if b!=null and (not (b is int or b is float) or b<0 or b>4 or b!=int(b)):return {}
	if not value.get("coastal",false) and value.portLevel>0:return {}
	if not value.get("weights") is Dictionary:return {}
	for district in DISTRICTS:
		var weight=value.weights.get(district,-1)
		if not (weight is int or weight is float) or not is_finite(weight) or weight<0:return {}
	if value.get("settlementId","")=="" or value.get("graphicalCultureId","")=="" or not value.get("terrain","") in ["plain","hill","river"]:return {}
	if not value.get("damage","") in ["intact","damaged","ruined"] or not value.get("construction","") in ["none","building"]:return {}
	if not value.get("monuments") is Array or not value.get("capital") is bool or not value.get("coastal") is bool:return {}
	if not value.has("seed") or value.seed<0 or value.seed>4294967295 or value.seed!=int(value.seed):return {}
	for key in ["schemaVersion","seed","portLevel","fortificationLevel","roadLevel"]:value[key]=int(value[key])
	for key in ["populationBand","prosperityBand"]:
		if value[key]!=null:value[key]=int(value[key])
	for key in DISTRICTS:value.weights[key]=float(value.weights[key])
	return value
