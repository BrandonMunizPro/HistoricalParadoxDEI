extends RefCounted
## Camera presentation only; source geography and stream residency are unchanged.
var settings={}
var cache_key=[]
var cache_limit=2800.
func _init(config={}):settings=config
func pitch_for(value,distance):
	var t=smoothstep(settings.get("strategic_begin_km",180.),settings.get("strategic_full_km",1800.),distance)
	var regional_min=lerp(8.,32.,smoothstep(30.,180.,distance))
	return clamp(value,lerp(regional_min,settings.get("strategic_min_pitch",48.),t),lerp(89.,settings.get("strategic_max_pitch",62.),t))
func footprint(pitch,yaw,aspect):
	var theta=deg_to_rad(pitch);var rotation=deg_to_rad(yaw)
	var offset=Vector3(0,sin(theta),cos(theta)).rotated(Vector3.UP,rotation)
	var forward=-offset;var right=Vector3.RIGHT.rotated(Vector3.UP,rotation);var up=right.cross(forward)
	var tangent=tan(deg_to_rad(21.));var points=[]
	for p in [Vector2(-1,-1),Vector2(0,-1),Vector2(1,-1),Vector2(1,0),Vector2(1,1),Vector2(0,1),Vector2(-1,1),Vector2(-1,0)]:
		var ray=forward+right*p.x*tangent*aspect+up*p.y*tangent
		if ray.y>=-.001:return []
		points.append(offset+ray*(-offset.y/ray.y))
	return points
func supported(world,center,points,distance):
	if points.is_empty():return false
	for p in points:
		var geo=world.unproject(center+p*distance)
		if geo.x< -11.95 or geo.x>74.95 or geo.y<12.05 or geo.y>61.95:return false
	return true
func maximum_at(world,focus,pitch,yaw,aspect):
	var key=[focus,pitch,yaw,aspect]
	if key==cache_key:return cache_limit
	cache_key=key
	var maximum=float(settings.get("maximum_distance_km",2800.));var minimum=float(settings.get("minimum_distance_km",1.2))
	var center=world.project(focus.x,focus.y)
	var points=footprint(pitch_for(pitch,maximum),yaw,aspect)
	if supported(world,center,points,maximum):cache_limit=maximum;return maximum
	var low=minimum;var high=maximum
	for i in 13:
		var middle=(low+high)*.5
		points=footprint(max(32.,pitch_for(pitch,middle)),yaw,aspect)
		if supported(world,center,points,middle):low=middle
		else:high=middle
	cache_limit=max(minimum,low*.95)
	return cache_limit
