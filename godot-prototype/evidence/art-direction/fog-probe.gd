extends SceneTree
func _initialize():
 var e=Environment.new()
 for p in e.get_property_list():
  if p.name.begins_with('fog_'):print(p.name,' = ',e.get(p.name),' hint=',p.hint_string)
 quit()
