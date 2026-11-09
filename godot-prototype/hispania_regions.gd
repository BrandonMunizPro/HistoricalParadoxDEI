extends RefCounted
## Physical transition masks, independent of historical/political data.
static var config={}
static func settings():
	if config.is_empty():config=JSON.parse_string(FileAccess.get_file_as_string("res://data/hispania-region.json"))
	return config
static func weight(geo):
	var c=settings();var b=c.bounds
	if geo.x<=b.west or geo.x>=b.east or geo.y<=b.south or geo.y>=b.north:return 0.
	var limit=preload("res://africa_regions.gd")
	var n=limit.limit(c.northLimit,geo.x);var s=limit.limit(c.southLimit,geo.x)
	return smoothstep(b.west,b.west+.25,geo.x)*(1.-smoothstep(b.east-.25,b.east,geo.x))*smoothstep(b.south,b.south+.25,geo.y)*(1.-smoothstep(b.north-.25,b.north,geo.y))*(1.-smoothstep(n-.15,n+.15,geo.y))*smoothstep(s-.05,s+.05,geo.y)
static func climate(c,geo):
	for zone in settings().get("climateZones",[]):
		var d=Vector2((geo.x-zone.center[0])/zone.radiusDegrees[0],(geo.y-zone.center[1])/zone.radiusDegrees[1]).length()
		var t=1.-smoothstep(.3,1.,d)
		c.g*=lerp(1.,float(zone.fertilityMultiplier),t);c.b=max(c.b,float(zone.minimumAridity)*t)
	return c
static func shader_helpers()->String:
	var c=settings();var code=""
	for entry in [["hispania_north_limit",c.northLimit],["hispania_south_limit",c.southLimit]]:
		code+="float %s(float x){"%entry[0]
		for i in range(1,entry[1].size()):
			var a=entry[1][i-1];var b=entry[1][i]
			code+="if(x<=%.6f)return mix(%.6f,%.6f,clamp((x-(%.6f))/%.6f,0.,1.));"%[b[0],a[1],b[1],a[0],b[0]-a[0]]
		code+="return %.6f;}\n"%entry[1][-1][1]
	var b=c.bounds
	code+="float hispania_scope(vec2 g){if(g.x<=%.6f||g.x>=%.6f||g.y<=%.6f||g.y>=%.6f)return 0.;float n=hispania_north_limit(g.x),s=hispania_south_limit(g.x);return smoothstep(%.6f,%.6f,g.x)*(1.-smoothstep(%.6f,%.6f,g.x))*smoothstep(%.6f,%.6f,g.y)*(1.-smoothstep(%.6f,%.6f,g.y))*(1.-smoothstep(n-.15,n+.15,g.y))*smoothstep(s-.05,s+.05,g.y);}\n"%[b.west,b.east,b.south,b.north,b.west,b.west+.25,b.east-.25,b.east,b.south,b.south+.25,b.north-.25,b.north]
	code+="vec4 hispania_climate(vec4 c,vec2 g){"
	for zone in c.get("climateZones",[]):
		code+="{float t=1.-smoothstep(.3,1.,length((g-vec2(%.6f,%.6f))/vec2(%.6f,%.6f)));c.g*=mix(1.,%.6f,t);c.b=max(c.b,%.6f*t);}"%[zone.center[0],zone.center[1],zone.radiusDegrees[0],zone.radiusDegrees[1],zone.fertilityMultiplier,zone.minimumAridity]
	return code+"return c;}\n"
