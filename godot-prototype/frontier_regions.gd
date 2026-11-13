extends RefCounted
## Baked physical coverage is shared by terrain, ocean and placement.
static var config={}
static var images={}
static var textures={}
static func settings():
	if config.is_empty():config=JSON.parse_string(FileAccess.get_file_as_string("res://data/frontier-regions.json"))
	return config
static func image_for(region):
	if not images.has(region):
		var image=Image.load_from_file("res://data/"+region+"/coverage.png");image.convert(Image.FORMAT_L8);images[region]=image
	return images[region]
static func texture_for(region):
	if not textures.has(region):textures[region]=ImageTexture.create_from_image(image_for(region))
	return textures[region]
static func weight(region,g,_world):
	var b=settings().regions[region].bounds
	if g.x<=b.west or g.x>=b.east or g.y<=b.south or g.y>=b.north:return 0.
	return preload("res://environment_rules.gd").sample_image(image_for(region),Vector2((g.x-b.west)/(b.east-b.west),(b.north-g.y)/(b.north-b.south))).r
static func shader_helpers(regions):
	var code=""
	for region in settings().order:
		if not regions.has(region):continue
		var b=settings().regions[region].bounds
		code+="uniform sampler2D %s_coverage:filter_linear,repeat_disable;\nfloat %s_scope(vec2 g){if(g.x<=%.6f||g.x>=%.6f||g.y<=%.6f||g.y>=%.6f)return 0.;vec2 q=vec2((g.x-(%.6f))/%.6f,(%.6f-g.y)/%.6f),s=vec2(textureSize(%s_coverage,0));return textureLod(%s_coverage,(q*(s-1.)+.5)/s,0.).r;}\n"%[region,region,b.west,b.east,b.south,b.north,b.west,b.east-b.west,b.north,b.north-b.south,region,region]
	return code