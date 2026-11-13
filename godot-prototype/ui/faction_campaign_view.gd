extends RefCounted
## Reads live map allocations, not background prose or inferred treaty mechanics.
var locations=[]
var names={}
func configure(relationships,patches,sites,research):
	locations=[];names={}
	var canonical={};var references={}
	for site in sites:canonical[site.id]=site.name
	for record in research:references[record.proposedId]=record.historicalName
	var districts={}
	for patch in patches.get("patches",[]):districts[patch.id.replace("territory:","relation:")]=patch.id
	for relation in relationships.get("records",[]):
		# Only explicitly linked districts participate. A cultural association or
		# geographic point inside an envelope cannot establish civic ownership.
		if not districts.has(relation.id):continue
		var title=canonical.get(relation.get("settlementId",""),references.get(relation.get("researchId",""),""))
		if title=="":continue
		var territory_id=districts[relation.id]
		names[territory_id]=title+" district"
		locations.append({"name":title,"territoryId":territory_id,"openingRelationship":relation.relationship})
	locations.sort_custom(func(a,b):return a.name.naturalnocasecmp_to(b.name)<0)
func snapshot(id,cartography):
	var result={"available":false,"territories":[],"locations":[]}
	if cartography==null or not cartography.enabled or cartography.regions==null:return result
	result.available=true
	for territory_id in cartography.control:
		if cartography.control[territory_id]!=id:continue
		var title=names.get(territory_id,territory_id.trim_prefix("territory:").replace("-"," ").capitalize())
		result.territories.append({"id":territory_id,"name":title})
	result.territories.sort_custom(func(a,b):return a.name.naturalnocasecmp_to(b.name)<0)
	for location in locations:
		if cartography.control.get(location.territoryId,"")==id:result.locations.append(location.duplicate(true))
	return result
