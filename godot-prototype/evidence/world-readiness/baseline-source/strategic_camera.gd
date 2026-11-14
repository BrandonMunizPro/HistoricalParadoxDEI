extends RefCounted
## Camera presentation only; source geography and stream residency are unchanged.
var settings={}
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
func maximum_at(_world,_focus,_pitch,_yaw,_aspect):
	# Bound zoom-out without changing the user's zoom while panning or orbiting.
	# A view near the coverage edge may extend beyond it; shrinking the distance
	# here makes traversing the map zoom in and permanently lose the chosen scale.
	return float(settings.get("maximum_distance_km",2800.))
