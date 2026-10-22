extends SceneTree
## Disposable native cache: identical ArrayMesh data, no terrain synthesis or material changes.
func _initialize():call_deferred("bake")

func bake():
	var world=load("res://world.gd").new()
	world.mesh_cache_building=true
	var entries={}
	var descriptors=world.read_json("data/world.json").tiles
	var global=world.read_json("data/global/manifest.json")
	descriptors=descriptors.filter(func(d):return d.kind!="world")+global.tiles
	descriptors.append({"id":"italia-backdrop","kind":"backdrop","mesh":world.read_json("data/regional/manifest.json").mesh})
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://data/native"))
	var ignore=FileAccess.open("res://data/native/.gdignore",FileAccess.WRITE);ignore.store_string("");ignore.close()
	var start=Time.get_ticks_msec()
	for d in descriptors:
		var parent="res://data/regional/"+d.id+".parent" if d.kind=="regional" else ("res://data/global/"+d.id+".parent" if d.kind=="world" else "")
		var mesh=world.mesh_from_file(d.mesh,parent)
		var path="res://data/native/"+d.id+".res"
		var error=ResourceSaver.save(mesh,path,ResourceSaver.FLAG_COMPRESS)
		assert(error==OK,"Native mesh save failed")
		entries[d.mesh]={"hash":world.mesh_fingerprint(d.mesh,parent),"path":path}
	var file=FileAccess.open("res://data/native/manifest.json",FileAccess.WRITE)
	file.store_string(JSON.stringify({"version":1,"entries":entries,"notice":"Derived native mesh cache, source SHA-256 validated before use; regenerate after mesh-reader changes."},"  "))
	world.free()
	print("NATIVE_MESH_CACHE_READY entries=",entries.size()," build_ms=",Time.get_ticks_msec()-start)
	quit()
