extends RefCounted
## Visual work-area masks only; never used for ownership or settlement membership.
var settings=JSON.parse_string(FileAccess.get_file_as_string("res://data/cartographic-rollout.json"))
func contains(point:Vector2)->bool:
	for r in settings.referenceRects:
		if point.x>=r[0] and point.x<=r[2] and point.y>=r[1] and point.y<=r[3]:return true
	var p=point*Vector2(.75,1.)
	for c in settings.referenceCorridors:
		var a=Vector2(c[0]*.75,c[1]);var b=Vector2(c[2]*.75,c[3]);var d=b-a
		var t=clamp((p-a).dot(d)/d.length_squared(),0.,1.)
		if p.distance_to(a+d*t)<=c[4]:return true
	return false
func shader_scope(function_name="reference_rollout_scope",extension_only=false)->String:
	var code="float "+function_name+"(vec2 geo){float weight=0.;"
	for r in settings.extensionRects if extension_only else settings.referenceRects:
		code+="weight=max(weight,smoothstep(%.6f,%.6f,geo.x)*(1.-smoothstep(%.6f,%.6f,geo.x))*smoothstep(%.6f,%.6f,geo.y)*(1.-smoothstep(%.6f,%.6f,geo.y)));"%[r[0]-.2,r[0]+.2,r[2]-.2,r[2]+.2,r[1]-.2,r[1]+.2,r[3]-.2,r[3]+.2]
	for c in settings.extensionCorridors if extension_only else settings.referenceCorridors:
		code+="{vec2 a=vec2(%.6f,%.6f),b=vec2(%.6f,%.6f),p=geo*vec2(.75,1.);vec2 d=b-a;float t=clamp(dot(p-a,d)/dot(d,d),0.,1.);weight=max(weight,1.-smoothstep(%.6f,%.6f,length(p-a-d*t)));}"%[c[0]*.75,c[1],c[2]*.75,c[3],c[4]-.15,c[4]+.15]
	return code+"return weight;}\n"
