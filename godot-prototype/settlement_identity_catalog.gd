extends RefCounted
## Extend the existing catalog; leave the preceding Roma slice reproducible.
static func merge_catalog(base,overlay):
	var result=base.duplicate(true)
	for section in ["cultures","chains","visuals","effects"]:
		for addition in overlay.get(section,[]):
			var index=-1
			for i in result[section].size():
				if result[section][i].id==addition.id:index=i;break
			if index<0:result[section].append(addition)
			else:result[section][index]=addition.duplicate(true)
	return result
