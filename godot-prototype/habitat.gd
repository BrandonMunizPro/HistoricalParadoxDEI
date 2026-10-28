extends RefCounted
## Presentation suitability, not historical land-cover evidence.
static func hash_cell(x:int,y:int)->float:
	var n=(x*374761393+y*668265263)&0xffffffff
	n=((n^(n>>13))*1274126177)&0xffffffff
	n=n^(n>>16)
	return float(n&65535)/65535.0
static func noise(p:Vector2)->float:
	var x=floori(p.x);var y=floori(p.y)
	var f=p-Vector2(x,y);f=f*f*(Vector2(3,3)-2*f)
	return lerp(lerp(hash_cell(x,y),hash_cell(x+1,y),f.x),lerp(hash_cell(x,y+1),hash_cell(x+1,y+1),f.x),f.y)
static func cover(p:Vector2,fertility:float,dryness:float,h:float)->float:
	var mosaic=noise(p*.18)*.5+noise(p*.71+Vector2(17,9))*.32+noise(p*4.3)*.18
	return smoothstep(.36,.68,mosaic+(fertility-.4)*.13-dryness*.075)*(1-smoothstep(1.8,2.7,h))
