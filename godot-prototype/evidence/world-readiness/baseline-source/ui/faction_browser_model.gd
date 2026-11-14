extends RefCounted
## Read-only projection. Cultural groups never contain ownership or settlement IDs.
var groups=[]
var by_id={}
var source_cultures={}
var source_registry={}
var presentation_sources={}
var research={}
var backgrounds={}
var background_sources={}
var error=""
func configure(scenario,presentation,taxonomy,excerpts,background_catalog={}):
	groups=[];by_id={};source_cultures={};backgrounds={};background_sources={};error=""
	var culture_groups={};var group_ids={}
	for culture in scenario.get("cultures",[]):source_cultures[culture.id]=culture
	for group in taxonomy.get("groups",[]):
		if group_ids.has(group.id):error="Duplicate cultural group ID";return false
		group_ids[group.id]=true;groups.append(group.duplicate(true))
		if group.cultureId!=null:
			if culture_groups.has(group.cultureId):error="Culture mapped twice";return false
			culture_groups[group.cultureId]=group.id
	if not group_ids.has("classification:review"):error="Missing unclassified group";return false
	var reviews=taxonomy.get("classificationReview",{})
	for id in reviews:
		if not scenario.factions.any(func(f):return f.id==id):error="Review refers to missing faction";return false
	for faction in scenario.factions:
		if by_id.has(faction.id):error="Duplicate faction ID";return false
		if faction.get("playerSelectable")!=null and typeof(faction.playerSelectable)!=TYPE_BOOL:error="Player-selectable status must be boolean or undecided";return false
		var row=faction.duplicate(true)
		row.groupId=culture_groups.get(row.get("culture",""),"classification:review")
		row.classificationNote="Inherited catalog classification; presentation grouping, not a claim of uniform ethnicity, language or ownership."
		row.classificationSource=""
		if reviews.has(row.id):
			row.groupId="classification:review";row.classificationNote=reviews[row.id].note;row.classificationSource=reviews[row.id].source
		elif not culture_groups.has(row.get("culture","")):
			row.classificationNote="No browser classification is available for this source culture. Retained for review."
		row.presentation= presentation.get("factions",{}).get(row.id,{})
		by_id[row.id]=row
	source_registry=scenario.get("sources",{}).duplicate(true)
	presentation_sources=presentation.get("sources",{}).duplicate(true)
	research=excerpts.get("records",{}).duplicate(true)
	for id in research:
		if not by_id.has(id):error="Research excerpt refers to missing faction";return false
	background_sources=background_catalog.get("sources",{}).duplicate(true)
	for id in background_catalog.get("records",{}):
		var entry=background_catalog.records[id]
		if not by_id.has(id) or not entry is Dictionary or not entry.get("text","") is String or entry.get("text","").strip_edges().is_empty():error="Invalid historical background";return false
		if not entry.get("sourceKeys",[]) is Array or entry.get("sourceKeys",[]).is_empty():error="Background requires sources";return false
		for key in entry.sourceKeys:
			if not background_sources.has(key):error="Unknown background source";return false
		if entry.get("articleVersion",1)>=2:
			if not entry.get("sections") is Array or entry.sections.size()<5:error="Historical article requires sections";return false
			var section_ids={}
			for section in entry.sections:
				if not section is Dictionary or not section.get("id","") is String or section.get("id","")=="" or section_ids.has(section.id):error="Invalid article section ID";return false
				section_ids[section.id]=true
				if not section.get("title","") is String or section.get("title","")=="" or not section.get("text","") is String or section.get("text","").strip_edges()=="":error="Empty article section";return false
				if not section.get("sourceKeys") is Array or section.sourceKeys.is_empty():error="Article section requires sources";return false
				for key in section.sourceKeys:
					if not key in entry.sourceKeys or not background_sources.has(key):error="Unknown article section source";return false
			for required in ["origins","homeland","internal","external","opening"]:
				if not section_ids.has(required):error="Missing historical article section";return false
		backgrounds[id]=entry.duplicate(true)
	return true
func background(id):
	if backgrounds.has(id):return backgrounds[id].duplicate(true)
	var row=by_id.get(id,{})
	if row.has("openingOverview"):return {"text":row.openingOverview,"sourceKeys":row.get("sources",[]).duplicate(),"legacy":true}
	return {"text":"A researched opening description is not yet available for this record.","sourceKeys":[]}
func group(id):
	for entry in groups:
		if entry.id==id:return entry
	return {}
func matches(row,query):
	var text=str(row.name)+" "+str(row.id)+" "+str(row.culture)+" "+str(group(row.groupId).get("name",""))
	text+=" "+str(source_cultures.get(row.culture,{}).get("family",""))
	for alias in row.get("aliases",[]):text+=" "+str(alias)
	return query.strip_edges().is_empty() or query.strip_edges().to_lower() in text.to_lower()
func grouped(query=""):
	var result=[]
	for entry in groups:
		var rows=[]
		for row in by_id.values():
			if row.groupId==entry.id and matches(row,query):rows.append(row)
		rows.sort_custom(func(a,b):return a.id<b.id if a.name.to_lower()==b.name.to_lower() else a.name.to_lower()<b.name.to_lower())
		if not rows.is_empty():result.append({"group":entry,"factions":rows})
	return result
