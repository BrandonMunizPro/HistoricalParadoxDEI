extends SceneTree
var failures=[]
var checks=0
func _initialize():call_deferred("run")
func check(value,message):
	checks+=1
	if not value:failures.append(message);push_error(message)
func run():
	var ordinary=preload("res://coast_catalog.gd").new()
	var prepared=preload("res://coast_catalog.gd").new()
	await prepared.preload_all(self)
	check(prepared.source_pinned,"Whole-world source cache is pinned")
	check(prepared.chunks.size()==prepared.manifest.chunks.size(),"Every source chunk is loaded")
	check(prepared.preloaded_bytes==132378576,"Exact source byte count")
	for entry in prepared.manifest.chunks:
		var id=int(entry.start)
		check(ordinary.segment(id)==prepared.segment(id),"Unmodified source data in chunk "+str(id))
		var s=prepared.segment(id);var point=(Vector2(s[0],s[1])+Vector2(s[2],s[3]))*.5
		for offset in [-.03,.03]:
			var p=point+Vector2(s[4],s[5])*offset
			check(ordinary.nearest(p)==prepared.nearest(p),"Identical nearest-coast result")
	check(prepared.chunks.size()==prepared.manifest.chunks.size(),"Queries across the world never evict source chunks")
	check(ordinary.chunks.size()<=4,"Diagnostic on-demand catalog retains bounded legacy behavior")
	var result={"passed":failures.is_empty(),"checks":checks,"failures":failures,"residentChunks":prepared.chunks.size(),"sourceBytes":prepared.preloaded_bytes}
	FileAccess.open("res://evidence/world-preload/catalog-validation.json",FileAccess.WRITE).store_string(JSON.stringify(result,"  "))
	print("COAST_PRELOAD_VALIDATION ",JSON.stringify(result));quit(0 if failures.is_empty() else 1)
