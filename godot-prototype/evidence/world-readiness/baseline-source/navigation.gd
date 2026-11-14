extends RefCounted
## Production presets only. Capture profiles are deliberately not an input here.
var presets={}

func configure(core,global):
	var candidate=core.duplicate(true)
	for key in global:
		if candidate.has(key):return false
		candidate[key]=global[key].duplicate()
	for value in candidate.values():
		if not value is Array or value.size()!=5 or value[2]<=0:return false
	presets=candidate
	return true

func resolve(key):
	return presets[key].duplicate() if presets.has(key) else []
