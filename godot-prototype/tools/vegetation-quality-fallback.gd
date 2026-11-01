extends SceneTree
func _initialize():
	var quality=load("res://vegetation_quality.gd").new()
	var original=quality.impostors.duplicate(true)
	quality.impostors=[]
	assert(quality.mesh_for(0)==null)
	quality.impostors=original
	quality.impostors[19].name="__missing_asset_fallback_probe__"
	assert(quality.mesh_for(19)==null)
	quality.enabled=false
	assert(quality.mesh_for(0)==null)
	print("VEGETATION_FALLBACK_OK empty_catalog=true missing_atlas=true disabled=true")
	quit()
