extends RefCounted
## All families are presentation rules, not historical land-cover assertions.
var world
var settings
var rivers: Image
var clearances=[]
var river_index={}
var projected_cells={}
var town_cells={}
var town_clearance=0.42
func _init(owner):
	world=owner
	town_clearance=JSON.parse_string(FileAccess.get_file_as_string("res://data/foundation-settings.json")).settlements.clearance_km
	settings=JSON.parse_string(FileAccess.get_file_as_string("res://data/environment-presentation.json"))
	rivers=Image.load_from_file("res://data/environment/river-corridors.png")
	rivers.convert(Image.FORMAT_R8)
	# Quarter-degree index of source segments; projection cache stays bounded.
	var hydrology=JSON.parse_string(FileAccess.get_file_as_string("res://data/hydrology.json"))
	var margin=max(.005,settings.scenery.coarse_footprint_km/50.0)
	for feature in hydrology.rivers:
		var lines=feature.geometry.coordinates if feature.geometry.type=="MultiLineString" else [feature.geometry.coordinates]
		for line in lines:
			for i in range(1,line.size()):
				var a=Vector2(line[i-1][0],line[i-1][1]);var b=Vector2(line[i][0],line[i][1])
				for y in range(floori((min(a.y,b.y)-margin)*4),floori((max(a.y,b.y)+margin)*4)+1):
					for x in range(floori((min(a.x,b.x)-margin)*4),floori((max(a.x,b.x)+margin)*4)+1):
						var key=Vector2i(x,y)
						if not river_index.has(key):river_index[key]=[]
						river_index[key].append(Vector4(a.x,a.y,b.x,b.y))
	for record in JSON.parse_string(FileAccess.get_file_as_string("res://data/settlement-presentation.json")).records:
		if not world.is_land(record.lon,record.lat):continue
		var position=world.project(record.lon,record.lat)
		var key=Vector2i(floori(position.x/10),floori(position.z/10))
		if not town_cells.has(key):town_cells[key]=[]
		town_cells[key].append(Vector2(position.x,position.z))
	for clearance in settings.settlement_clearances:
		for site in world.sites:
			if site.id==clearance.site_id:
				var p=world.project(site.lon,site.lat)
				clearances.append(Vector3(p.x,p.z,clearance.radius_km))
static func sample_image(image:Image,uv:Vector2)->Color:
	var p=uv.clamp(Vector2.ZERO,Vector2.ONE)*Vector2(image.get_width()-1,image.get_height()-1)
	var x=floori(p.x);var y=floori(p.y);var nx=mini(x+1,image.get_width()-1);var ny=mini(y+1,image.get_height()-1)
	return image.get_pixel(x,y).lerp(image.get_pixel(nx,y),p.x-x).lerp(image.get_pixel(x,ny).lerp(image.get_pixel(nx,ny),p.x-x),p.y-y)
func climate(lon,lat):
	var uv=Vector2((lon+12)/87,(62-lat)/50)
	var c=sample_image(world.global_ecology,uv)
	c.a=sample_image(rivers,uv).r
	return c
static func blend_weights(latitude:float,c:Color,latitude_rules:Array,dry_river_rules:Array)->Vector4:
	var temperate=smoothstep(latitude_rules[0],latitude_rules[1],latitude)*(1-smoothstep(latitude_rules[2],latitude_rules[3],c.b))
	var dry=smoothstep(dry_river_rules[0],dry_river_rules[1],c.b)
	var river=smoothstep(dry_river_rules[2],dry_river_rules[3],c.a)
	return Vector4((1-dry)*(1-temperate)*(1-river),(1-dry)*temperate*(1-river),dry*(1-river),river)
func weights(latitude,c):return blend_weights(latitude,c,settings.latitude_rules,settings.dry_river_rules)
func north_africa(lon,lat):
	var r=settings.north_africa.scope_rules
	return scope_strength(lon,lat,r)
static func scope_strength(lon,lat,r):
	var north=lerp(r[2],r[3],smoothstep(r[0],r[1],lon))
	return smoothstep(12.0,18.0,lat)*(1-smoothstep(north-1,north,lat))*(1-smoothstep(36.0,39.0,lon))
func fertile_plain(c,h,slope=0.0):
	var r=settings.north_africa.plain_rules
	return plain_strength(c,h,slope,r)
static func plain_strength(c,h,slope,r):
	return smoothstep(r[0],r[1],c.g)*(1-smoothstep(r[2],r[3],h))*(1-smoothstep(.015,.08,slope))
func is_clear(p:Vector2,margin=0.0):
	var cell=Vector2i(floori(p.x/10),floori(p.y/10))
	for y in [-1,0,1]:
		for x in [-1,0,1]:
			for point in town_cells.get(cell+Vector2i(x,y),[]):
				if p.distance_squared_to(point)<pow(town_clearance+margin,2):return true
	for area in clearances:
		if p.distance_to(Vector2(area.x,area.y))<area.z+margin:return true
	return false

func over_river(p:Vector2,lon:float,lat:float,footprint=-1.0)->bool:
	var key=Vector2i(floori(lon*4),floori(lat*4))
	if not river_index.has(key):return false
	if not projected_cells.has(key):
		var segments=[]
		for entry in river_index[key]:
			var a=world.project(entry.x,entry.y);var b=world.project(entry.z,entry.w)
			segments.append(Vector4(a.x,a.z,b.x,b.z))
		if projected_cells.size()>=128:projected_cells.erase(projected_cells.keys()[0])
		projected_cells[key]=segments
	var clearance2=pow(settings.scenery.river_clearance_km if footprint<0 else footprint,2)
	for entry in projected_cells[key]:
		var a=Vector2(entry.x,entry.y);var delta=Vector2(entry.z,entry.w)-a
		var t=clamp((p-a).dot(delta)/max(.0000001,delta.length_squared()),0.0,1.0)
		if p.distance_squared_to(a+delta*t)<clearance2:return true
	return false
