extends SceneTree
var world
var checks=[]
func _initialize():call_deferred("run")
func settle():
	var frames=0
	while frames<2000:
		await process_frame;frames+=1
		if frames>=90 and world.is_settled():return
	assert(false,"Readiness timeout")
func vertices():
	var packed=PackedVector3Array()
	for i in world.regional_river.mesh.get_surface_count():
		var arrays=world.regional_river.mesh.surface_get_arrays(i)
		assert(not arrays.is_empty())
		packed.append_array(arrays[Mesh.ARRAY_VERTEX])
	var list=Array(packed)
	list.sort_custom(func(a,b):return a.x<b.x if a.x!=b.x else (a.y<b.y if a.y!=b.y else a.z<b.z))
	return PackedVector3Array(list).to_byte_array()
func run():
	world=load("res://world.tscn").instantiate();root.add_child(world);world.capture_done=true
	Engine.max_fps=0;DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	assert(world.landscape_quality!=null)
	world.focus=Vector2(12.477226,41.886671);world.goal_focus=world.focus;world.distance=.30;world.goal_distance=.30;world.pitch=42.;world.yaw=35.;world.queue_tiles()
	await settle()
	world.set_process(false)
	var quality=world.landscape_quality
	world.landscape_quality=null
	await world.make_regional_rivers(world.river_view_signature())
	var before=vertices()
	world.landscape_quality=quality
	await world.make_regional_rivers(world.river_view_signature())
	var after=vertices()
	assert(before.size()>0 and before==after,"River source positions/widths changed")
	checks.append({"test":"Tiber view river vertices identical with quality disabled/enabled","vertices":before.size()/12,"passed":true})
	world.set_process(true)
	world.focus=Vector2(12.702,41.725);world.goal_focus=world.focus
	for distance in [15.1,14.9,8.1,7.9,3.1,2.9,.65]:
		world.distance=distance;world.goal_distance=distance;world.queue_tiles();await settle()
		assert(world.resident.size()<=13)
		assert(world.resident.has("aricia-landscape")== (distance<=15.))
		assert(world.base_material.get_shader_parameter("landscape_enabled")==true)
		if distance<=15.:
			var entry=world.resident["aricia-landscape"]
			assert(entry.node.mesh.get_surface_count()==1)
			var d=entry.descriptor
			for x in [0,d.grid]:
				for y in [0,d.grid/2,d.grid]:
					var lon=lerp(d.bounds.west,d.bounds.east,float(x)/d.grid);var lat=lerp(d.bounds.north,d.bounds.south,float(y)/d.grid)
					assert(abs(world.mesh_vertex_height(entry,x,y)-world.sample_entry(world.resident.N41E12,lon,lat))<.00002)
		checks.append({"test":"Aricia terrain and vegetation LOD boundary","distanceKm":distance,"resident":world.resident.size(),"detailResident":world.resident.has("aricia-landscape"),"passed":true})
	for kind in ["grass","soil","rock"]:
		for channel in ["color","normal","roughness"]:
			var texture=quality.textures["landscape_"+kind+"_"+channel]
			var image=texture.get_image();assert(image.has_mipmaps() and image.is_compressed())
			if channel=="normal":
				assert(image.decompress()==OK)
				var path="res://assets/settlement-identities/soil-normal.jpg" if kind=="soil" else "res://assets/landscape-quality/"+kind+"-normal.jpg"
				var source=load(path).get_image()
				if source.is_compressed():assert(source.decompress()==OK)
				var error=0.;var error_sum=0.;var sample_count=0
				for y in range(0,image.get_height(),64):
					for x in range(0,image.get_width(),64):
						var a=image.get_pixel(x,y);var b=source.get_pixel(x,y);var e=max(abs(a.r-b.r),abs(a.g-b.g));error=max(error,e);error_sum+=e;sample_count+=1
				assert(error_sum/sample_count<.03 and error<.15,"BC5 normal XY channels differ excessively")
			checks.append({"test":"PBR mipmaps and compressed channel layout","material":kind,"channel":channel,"passed":true})
	world.focus=Vector2(12.67334715,41.72139965);world.goal_focus=world.focus;world.distance=.65;world.goal_distance=.65
	# Existing population culling caches a .2-degree focus bucket. Explicitly
	# invalidate for this material-binding test after a same-bucket camera jump.
	# This is a test setup step, not a settlement renderer change.
	world.settlements.signature="";world.queue_tiles();await settle()
	var ground_count=0
	for node in world.find_children("*","MeshInstance3D",true,false):
		var mat=node.material_override
		if mat is ShaderMaterial and mat.shader!=null and mat.shader.resource_path in ["res://roma_showcase_ground.gdshader","res://roma_showcase_edge.gdshader"]:
			assert(mat.get_shader_parameter("landscape_enabled")==true);ground_count+=1
	assert(ground_count>0)
	checks.append({"test":"Existing settlement ground inherits shared landscape without building edits","boundMaterials":ground_count,"passed":true})
	var report={"checks":checks,"count":checks.size(),"passed":true,"artisticAcceptance":"Not assessed by these tests"}
	FileAccess.open("res://evidence/terrain-water-20261028/native-validation.json",FileAccess.WRITE).store_string(JSON.stringify(report,"  "))
	print("LANDSCAPE_VALIDATION_OK ",checks.size())
	quit()
