extends RefCounted
static func surface_point(previous,a,b,next,t,width):
	var linear=a.lerp(b,t)
	var delta=a.cubic_interpolate(b,previous,next,t)-linear;delta.y=0
	return linear+delta.limit_length(width*.6)
## Continuous visual banks around unchanged source centreline vertices.
static func bank_offset(previous,point,next,width):
	var before=point-previous;before.y=0
	var after=next-point;after.y=0
	if before.length_squared()<.00000001:before=after
	if after.length_squared()<.00000001:after=before
	var n0=before.normalized().cross(Vector3.UP)
	var n1=after.normalized().cross(Vector3.UP)
	var bisector=(n0+n1).normalized()
	if bisector.length_squared()<.001:return n1*width
	return bisector*min(width/max(.01,abs(bisector.dot(n1))),width*1.5)
