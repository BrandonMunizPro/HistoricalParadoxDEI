extends RefCounted
## Geographic definitions and political state have separate lifecycles.
## No conquest rules. Unapproved memberships/centres cannot become active.
var definitions={}
var owners={}
var legacy_ids={}
var known_factions={}
var known_settlements={}
func configure(catalog,initial,factions,settlements)->bool:
	if initial.owners.size()!=catalog.regions.size():return false
	var staged={};var aliases={};var indices={};var faction_ids={};var settlement_ids={};var memberships={}
	for faction in factions:faction_ids[faction.id]=true
	for settlement in settlements:settlement_ids[settlement.id]=settlement
	for region in catalog.regions:
		if staged.has(region.id) or indices.has(region.rasterIndex) or aliases.has(region.legacyTerritoryId):return false
		if not initial.owners.has(region.id):return false
		if initial.owners[region.id]!="" and not faction_ids.has(initial.owners[region.id]):return false
		if region.definitionStatus!="approved" and (not region.settlementIds.is_empty() or region.controlCentre!=null):return false
		for id in region.settlementIds:
			if not settlement_ids.has(id) or memberships.has(id):return false
			memberships[id]=region.id
		if region.definitionStatus=="approved":
			if region.controlCentre==null or not region.controlCentre.has("locationId"):return false
			if region.controlCentre.has("settlementId"):
				var id=region.controlCentre.settlementId
				if not id in region.settlementIds or settlement_ids[id].locationId!=region.controlCentre.locationId:return false
			elif not region.controlCentre.locationId in region.get("locationIds",[]):return false
		staged[region.id]=region.duplicate(true);aliases[region.legacyTerritoryId]=region.id;indices[region.rasterIndex]=true
	definitions=staged;owners=initial.owners.duplicate(true);legacy_ids=aliases;known_factions=faction_ids;known_settlements=settlement_ids
	return true
func set_owner(region_id:String,faction_id:String)->bool:
	if not definitions.has(region_id) or (faction_id!="" and not known_factions.has(faction_id)):return false
	owners[region_id]=faction_id
	return true
func export_state():return {"version":1,"owners":owners.duplicate(true)}
func restore_state(state)->bool:
	if state.get("version")!=1 or not state.has("owners") or state.owners.size()!=definitions.size():return false
	for id in state.owners:
		if not definitions.has(id) or (state.owners[id]!="" and not known_factions.has(state.owners[id])):return false
	owners=state.owners.duplicate(true)
	return true
