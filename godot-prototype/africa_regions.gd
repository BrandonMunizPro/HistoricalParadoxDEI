extends RefCounted
## Geographic presentation masks and suitability. No political state or settlements.
static var config={}
static var eastern={}
static func settings():
	if config.is_empty():config=JSON.parse_string(FileAccess.get_file_as_string("res://data/africa-regions.json"))
	return config
static func egypt_weight(geo):
	if eastern.is_empty():eastern=JSON.parse_string(FileAccess.get_file_as_string("res://data/eastern-regions.json"))
	var b=eastern.regions.egypt.bounds
	return smoothstep(b.west,b.west+1.3,geo.x)*(1.-smoothstep(b.east-.25,b.east,geo.x))*smoothstep(b.south,b.south+.25,geo.y)*(1.-smoothstep(b.north-.25,b.north,geo.y))
static func limit(points,x):
	for i in range(1,points.size()):
		if x<=points[i][0]:return lerp(float(points[i-1][1]),float(points[i][1]),clamp((x-points[i-1][0])/(points[i][0]-points[i-1][0]),0.,1.))
	return float(points[-1][1])
static func raw_weight(region,geo):
	var cfg=settings();var b=cfg.regions[region].bounds
	if geo.x<=b.west or geo.x>=b.east or geo.y<=b.south or geo.y>=b.north:return 0.
	return smoothstep(b.west,b.west+.25,geo.x)*(1.-smoothstep(b.east-.25,b.east,geo.x))*smoothstep(b.south,b.south+.25,geo.y)*(1.-smoothstep(b.north-.25,b.north,geo.y))*(1.-smoothstep(limit(cfg.northMarineLimit,geo.x)-.05,limit(cfg.northMarineLimit,geo.x)+.05,geo.y))*(1.-smoothstep(limit(cfg.eastMarineLimit,geo.y)-.05,limit(cfg.eastMarineLimit,geo.y)+.05,geo.x))
static func shader_helpers()->String:
	var cfg=settings();var code=""
	for pair in [["africa_north_limit",cfg.northMarineLimit],["africa_east_limit",cfg.eastMarineLimit]]:
		code+="float %s(float x){"%pair[0]
		for i in range(1,pair[1].size()):
			var a=pair[1][i-1];var b=pair[1][i]
			code+="if(x<=%.6f)return mix(%.6f,%.6f,clamp((x-(%.6f))/%.6f,0.,1.));"%[b[0],a[1],b[1],a[0],b[0]-a[0]]
		code+="return %.6f;}\n"%pair[1][-1][1]
	for region in cfg.order:
		var b=cfg.regions[region].bounds
		code+="float %s_raw_scope(vec2 g){if(g.x<=%.6f||g.x>=%.6f||g.y<=%.6f||g.y>=%.6f)return 0.;float n=africa_north_limit(g.x),e=africa_east_limit(g.y);return smoothstep(%.6f,%.6f,g.x)*(1.-smoothstep(%.6f,%.6f,g.x))*smoothstep(%.6f,%.6f,g.y)*(1.-smoothstep(%.6f,%.6f,g.y))*(1.-smoothstep(n-.05,n+.05,g.y))*(1.-smoothstep(e-.05,e+.05,g.x));}\n"%[region,b.west,b.east,b.south,b.north,b.west,b.west+.25,b.east-.25,b.east,b.south,b.south+.25,b.north-.25,b.north]
	code+="float africa_raw_union(vec2 g){float s=0.;"
	for region in cfg.order:code+="s=max(s,%s_raw_scope(g));"%region
	code+="return s;}\nfloat africa_basalt(vec2 g,float h){float s=0.;"
	for field in cfg.get("mineralFields",[]):
		code+="s=max(s,%.6f*(1.-smoothstep(.4,1.,length((g-vec2(%.6f,%.6f))/vec2(%.6f,%.6f))))*smoothstep(%.6f,%.6f,h));"%[field.strength,field.center[0],field.center[1],field.radiusDegrees[0],field.radiusDegrees[1],field.minimumElevationKm,field.minimumElevationKm+.5]
	return code+"return s;}\n"
