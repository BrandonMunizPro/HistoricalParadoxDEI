extends SceneTree
func _initialize():call_deferred("run")
func run():
	for kind in ["grass","soil","rock"]:
		var image=load("res://assets/landscape-quality/"+kind+"-normal.res").get_image()
		var original_format=image.get_format();image.decompress()
		var source=load("res://assets/settlement-identities/soil-normal.jpg" if kind=="soil" else "res://assets/landscape-quality/"+kind+"-normal.jpg").get_image()
		if source.is_compressed():source.decompress()
		var maximum=0.;var error=0.;var count=0;var worst={}
		for y in range(0,image.get_height(),16):
			for x in range(0,image.get_width(),16):
				var a=image.get_pixel(x,y);var b=source.get_pixel(x,y);var e=max(abs(a.r-b.r),abs(a.g-b.g))
				if e>maximum:maximum=e;worst={"sample":str(a),"source":str(b)}
				error+=e;count+=1
		print(kind," format=",original_format," max=",maximum," mean=",error/count," worst=",worst)
	quit()
