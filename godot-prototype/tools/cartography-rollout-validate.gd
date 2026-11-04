extends SceneTree
func _initialize():
	var rollout=load("res://cartography_rollout.gd").new()
	for point in [Vector2(12.49,41.89),Vector2(13.5,43.6),Vector2(15.9,41.7),Vector2(17.2,40.45),Vector2(17.94,40.64),Vector2(17.1,39.1),Vector2(15.65,38.12),Vector2(15.09,37.50),Vector2(10.2,45.54)]:
		assert(rollout.contains(point),"Italian coverage gap at "+str(point))
	for point in [Vector2(23.7,38.),Vector2(19.45,41.3),Vector2(15.2,44.6),Vector2(22.3,37.3),Vector2(22.5,40.75)]:
		assert(rollout.contains(point),"Illyria/Greece coverage gap at "+str(point))
	for point in [Vector2(10.3,36.8),Vector2(9.,42.),Vector2(28.,39.),Vector2(25.,35.),Vector2(26.,42.)]:
		assert(not rollout.contains(point),"Unintended rollout at "+str(point))
	assert(rollout.settings.activeWave=="02-03-illyria-greece")
	var current=0
	for wave in rollout.settings.waves:
		if wave.status=="current":current+=1
	assert(current==2)
	print("ROLLOUT_SCOPE_OK Italy/Sicily retained; Illyria/mainland Greece active; Africa/Corsica/Crete/Anatolia/Thrace excluded")
	quit()
