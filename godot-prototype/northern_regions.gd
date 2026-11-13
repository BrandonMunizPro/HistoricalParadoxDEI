extends RefCounted
## Physical scopes. Channel and existing regional coverage are not political borders.
static var config={}
static func settings():
	if config.is_empty():config=JSON.parse_string(FileAccess.get_file_as_string("res://data/northern-regions.json"))
	return config
static func raw_weight(region,geo):
	var c=settings().regions[region];var b=c.bounds
	if geo.x<=b.west or geo.x>=b.east or geo.y<=b.south or geo.y>=b.north:return 0.
	var interp=preload("res://africa_regions.gd")
	var n=interp.limit(c.northLimit,geo.x);var s=interp.limit(c.southLimit,geo.x)
	return smoothstep(b.west,b.west+.25,geo.x)*(1.-smoothstep(b.east-.25,b.east,geo.x))*smoothstep(b.south,b.south+.25,geo.y)*(1.-smoothstep(b.north-.25,b.north,geo.y))*(1.-smoothstep(n-.15,n+.15,geo.y))*smoothstep(s-.05,s+.05,geo.y)
static func weight(region,geo):
	var w=raw_weight(region,geo)
	if region=="gaul" and w>.0:
		w*=1.-smoothstep(.001,.01,preload("res://hispania_regions.gd").weight(geo))
	return w
static func shader_helpers():
	var code=""
	for region in settings().order:
		var c=settings().regions[region];var b=c.bounds
		for side in ["north","south"]:
			var points=c[side+"Limit"]
			code+="float %s_%s_limit(float x){"%[region,side]
			for i in range(1,points.size()):
				var a=points[i-1];var z=points[i]
				code+="if(x<=%.6f)return mix(%.6f,%.6f,clamp((x-(%.6f))/%.6f,0.,1.));"%[z[0],a[1],z[1],a[0],z[0]-a[0]]
			code+="return %.6f;}\n"%points[-1][1]
		code+="float %s_scope(vec2 g){if(g.x<=%.6f||g.x>=%.6f||g.y<=%.6f||g.y>=%.6f)return 0.;float n=%s_north_limit(g.x),s=%s_south_limit(g.x);float w=smoothstep(%.6f,%.6f,g.x)*(1.-smoothstep(%.6f,%.6f,g.x))*smoothstep(%.6f,%.6f,g.y)*(1.-smoothstep(%.6f,%.6f,g.y))*(1.-smoothstep(n-.15,n+.15,g.y))*smoothstep(s-.05,s+.05,g.y);"%[region,b.west,b.east,b.south,b.north,region,region,b.west,b.west+.25,b.east-.25,b.east,b.south,b.south+.25,b.north-.25,b.north]
		if region=="gaul":
			if not OS.get_cmdline_user_args().has("--hispania-baseline"):code+="w*=1.-smoothstep(.001,.01,hispania_scope(g));"
		code+="return w;}\n"
	return code
