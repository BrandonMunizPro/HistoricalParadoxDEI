extends "res://settlement_development_kit.gd"
## Original architectural kit: true arcades, ordered sanctuaries, rural yards.
const IDENTITY_DIR="res://assets/settlement-identities/"
func identity_materials():
	load_materials()
	for i in mats.size():mats[i]=mats[i].duplicate()
	mats[0].albedo_texture=load(IDENTITY_DIR+"lime-color.jpg");mats[0].normal_texture=load(IDENTITY_DIR+"lime-normal.jpg");mats[0].roughness_texture=load(IDENTITY_DIR+"lime-roughness.jpg");mats[0].albedo_color=Color("ecdfbf");mats[0].normal_scale=.22
	# Limewashed local stone with retained stone relief; no dark stone map on every facade.
	mats[2].albedo_texture=load(IDENTITY_DIR+"lime-color.jpg");mats[2].albedo_color=Color("c8b58e");mats[2].normal_scale=.25
	mats[1].albedo_color=Color("f3dbc4");mats[6].albedo_color=Color("d4b877")
	for i in mats.size():assert(ResourceSaver.save(mats[i],IDENTITY_DIR+"material-"+str(i)+".tres")==OK)
func identity_save(name):
	var mesh=ArrayMesh.new()
	for s in tools:
		var a=s.commit_to_arrays()
		if a[Mesh.ARRAY_VERTEX]!=null and a[Mesh.ARRAY_VERTEX].size()>0:s.generate_tangents();s.index();s.commit(mesh)
	assert(ResourceSaver.save(mesh,IDENTITY_DIR+name+".res")==OK)
	var bounds=mesh.get_aabb()
	return {"name":name,"triangles":faces,"surfaces":mesh.get_surface_count(),"boundsM":[bounds.position.x*1000,bounds.position.z*1000,bounds.size.x*1000,bounds.size.z*1000],"heightM":bounds.size.y*1000}
func arch(p,width,spring,thickness=.35,depth=.7):
	var r=width*.5;var segments=8 if simplified else 14
	box(p+Vector3(-r-thickness*.5,spring*.5,0),Vector3(thickness,spring,depth),2)
	box(p+Vector3(r+thickness*.5,spring*.5,0),Vector3(thickness,spring,depth),2)
	for i in segments:
		var a=PI*i/segments;var b=PI*(i+1)/segments
		var ia=p+Vector3(cos(a)*r,spring+sin(a)*r,depth*.5)
		var ib=p+Vector3(cos(b)*r,spring+sin(b)*r,depth*.5)
		var oa=p+Vector3(cos(a)*(r+thickness),spring+sin(a)*(r+thickness),depth*.5)
		var ob=p+Vector3(cos(b)*(r+thickness),spring+sin(b)*(r+thickness),depth*.5)
		var shift=Vector3(0,0,-depth)
		quad(ia,oa,ob,ib,2);quad(oa+shift,ia+shift,ib+shift,ob+shift,2)
		quad(ia,ib,ib+shift,ia+shift,2);quad(ob,oa,oa+shift,ob+shift,2)
		if not simplified:box(p+Vector3(cos((a+b)*.5)*(r+thickness*.5),spring+sin((a+b)*.5)*(r+thickness*.5),depth*.5+.02),Vector3(.07,.10,.05),4)
func arcade(p,bays,turn=0.0):
	var saved=frame;frame=saved*Transform3D(Basis(Vector3.UP,turn),p)
	var width=bays*3.6
	box(Vector3(0,.22,-1),Vector3(width+.8,.44,6),2)
	box(Vector3(0,2.8,-3.7),Vector3(width,.4,5.0),5)
	box(Vector3(0,3.1,-4),Vector3(width,6.2,.35),0)
	for side in [-1.,1.]:box(Vector3(side*(width*.5+.15),2.9,-1.2),Vector3(.5,5.8,5.4),0)
	for i in bays:
		var x=(i-(bays-1)*.5)*3.6
		arch(Vector3(x,0,1),2.9,2.25,.32,.7)
		box(Vector3(x,.95,-.3),Vector3(2.5,1.9,.9),3)
		if not simplified:
			for j in 3:pot(Vector3(x+(j-1)*.6,1.95,-.3),.45)
	box(Vector3(0,4.35,1),Vector3(width+.8,.5,.95),2)
	box(Vector3(0,4.7,-1.5),Vector3(width+.9,.25,6.7),3)
	roof(Vector3(0,4.9,-1.5),width+.7,6.8,1.7)
	frame=saved
func paved_court(w,l,step=2.5):
	for iz in int(l/step):
		for ix in int(w/step):
			var x=-w*.5+(ix+.5)*step;var z=-l*.5+(iz+.5)*step
			color=Color(.86+rng.randf()*.14,.86+rng.randf()*.14,.86+rng.randf()*.14)
			box(Vector3(x,.07,z),Vector3(step-.055,.14,step-.055),2)
	color=Color.WHITE
func civic_identity(level):
	if level==1:
		paved_court(23,19,3)
		council(Vector3(0,0,-8),11,8,4.5)
		for side in [-1.,1.]:
			for j in 3:box(Vector3(side*8,.55,2+j*2),Vector3(1.2,1.1,1.8),3)
		return
	if level==2:
		paved_court(37,31,3)
		council(Vector3(3,0,-14),19,13,8)
		arcade(Vector3(-19,0,1),7,PI*.5)
		for j in 5:column(Vector3(19,0,-8+j*4),5.4,.3,2)
		box(Vector3(19,5.5,0),Vector3(4,.45,22),3);roof(Vector3(19,5.8,0),4,22,1)
		box(Vector3(3,.85,10),Vector3(10,1.7,4),2)
		return
	paved_court(61,53,3)
	council(Vector3(8,0,-24),25,17,10)
	# Clerestory, cornice and a distinct elevated council silhouette.
	for side in [-1.,1.]:
		for j in 7:box(Vector3(8+(j-3)*3,8,-24+side*8.6),Vector3(1.3,1.4,.12),5)
		box(Vector3(8,7,-24+side*8.7),Vector3(25,.22,.25),4)
	arcade(Vector3(-31,0,-1),13,PI*.5);arcade(Vector3(32,0,1),13,-PI*.5)
	# Assembly terraces and original speaker's platform, with an axial civic void.
	for row in 4:
		var radius=7.2+row*.9
		for i in 24:
			var a=.1*PI+i*1.45*PI/24;var b=a+1.45*PI/24
			beam(Vector3(-5+cos(a)*radius,.16+row*.25,5+sin(a)*radius),Vector3(-5+cos(b)*radius,.16+row*.25,5+sin(b)*radius),.7,2)
	box(Vector3(-3,1,18),Vector3(13,2,5),2)
	for i in 5:box(Vector3(-3,.1+i*.2,22-i*.5),Vector3(12,.22,.65),2)
	for side in [-1.,1.]:
		column(Vector3(side*23,0,21),6,.4,2);tube(Vector3(side*23,6.1,21),.6,.8,3,.3,12)
	for j in 7:pot(Vector3(-21+j*7,0,26),.8)
func pediment(p,w,h):
	tri(p+Vector3(-w*.5,0,0),p+Vector3(w*.5,0,0),p+Vector3(0,h,0),0)
	beam(p+Vector3(-w*.5,0,.08),p+Vector3(0,h,.08),.24,4);beam(p+Vector3(0,h,.08),p+Vector3(w*.5,0,.08),.24,4)
	# Original terracotta bosses and radial strips; no copied mythological relief.
	for j in 7:
		var x=(j-3)*w*.1;var height=h*(1-abs(x)/(w*.5))*.6
		tube(p+Vector3(x,.25,.14),.2,height,4,.1,8)
func sanctuary_identity(level):
	if level==1:
		for i in 3:box(Vector3(0,.12+i*.25,-1),Vector3(8-i*.2,.3,8-i*.2),2)
		wing(Vector3(0,.6,-2),6,6,3.8)
		for x in [-2.,2.]:column(Vector3(x,.6,3),3.8,.25,3)
		roof(Vector3(0,4.5,1),7.5,7.5,2.)
		box(Vector3(0,.8,6.3),Vector3(2,1.6,1.6),2);return
	var width=18. if level==2 else 27.;var length_value=22. if level==2 else 31.;var height=7. if level==2 else 9.5
	for i in 5:box(Vector3(0,.2+i*.32,-3),Vector3(width+.8-i*.15,.4,length_value+.6-i*.15),2)
	for i in 8:box(Vector3(0,.11+i*.19,length_value*.5+2-i*.48),Vector3(width*.65,.22,.55),2)
	# Masonry cella and deep columnar porch, not a rescaled house.
	box(Vector3(0,height*.5+1.6,-length_value*.22),Vector3(width*.84,height,length_value*.51),0)
	box(Vector3(0,4,-length_value*.22+length_value*.255+.04),Vector3(2.7,4.9,.10),5)
	var rows=2 if level==2 else 3;var columns=4 if level==2 else 6
	for row in rows:
		for i in columns:column(Vector3(-width*.44+i*width*.88/(columns-1),1.6,length_value*.05+row*4.3),height,.42 if level==2 else .5,2)
	box(Vector3(0,height+1.7,-1),Vector3(width+1,.6,length_value+3),3)
	for j in int(width*1.1):box(Vector3(-width*.52+j*.95,height+1.85,length_value*.5+.7),Vector3(.28,.34,.45),4)
	roof(Vector3(0,height+2.1,-1),width+2,length_value+3,width*.28)
	pediment(Vector3(0,height+2.2,length_value*.5+1),width+1,width*.28)
	box(Vector3(0,.8,length_value*.5+7),Vector3(3,1.6,2),2)
	if level==3:
		for side in [-1.,1.]:
			var saved=frame;frame=saved*Transform3D(Basis.IDENTITY,Vector3(side*24,0,1));arcade(Vector3.ZERO,12,PI*.5*side);frame=saved
		for side in [-1.,1.]:box(Vector3(side*25,.55,0),Vector3(.6,1.1,56),2)
		for x in [-24.,24.]:column(Vector3(x,0,29),6,.4,2)
func rural_house(p,w,l,h):
	wing(p,w,l,h,1,false,true)
	for side in [-1.,1.]:
		beam(p+Vector3(side*w*.4,0,l*.5+3),p+Vector3(side*w*.4,2.7,l*.5+3),.18,3)
	cloth(p+Vector3(-w*.5,3.0,l*.5),p+Vector3(w*.5,3,l*.5),p+Vector3(w*.5,2.5,l*.5+3.4),p+Vector3(-w*.5,2.5,l*.5+3.4),6)
func farm_identity(level):
	if level==1:
		rural_house(Vector3(-2,0,-3),9,11,3.7)
		grain_house(Vector3(5,0,5),4,6,2.2)
		for j in 4:stook(Vector3(-4+j*1.4,0,8))
		return
	if level==2:
		rural_house(Vector3(-9,0,-5),10,17,4.1)
		grain_house(Vector3(9,0,-6),8,16,4.0)
		wing(Vector3(0,0,-14),12,6,3.3)
		threshing(Vector3(3,0,9),5)
		for j in 9:stook(Vector3(-12+(j%3)*1.3,0,8+floori(j/3.)*1.5))
		return
	rural_house(Vector3(-18,0,-5),10,23,5)
	grain_house(Vector3(17,0,-4),11,26,5.5)
	wing(Vector3(-1,0,-18),25,7,4.4,1,true)
	for side in [-1.,1.]:
		for j in 5:beam(Vector3(side*11,0,-7+j*4),Vector3(side*11,3,-7+j*4),.17,3)
		roof(Vector3(side*11,3.1,1),4,25,1.1)
	threshing(Vector3(0,0,6),6.4)
	for j in 14:stook(Vector3(-9+(j%7)*2.7,0,17+floori(j/7.)*1.6))
	for side in [-1.,1.]:
		for j in 6:pot(Vector3(side*10,0,-11+j*3),.85)
func market_identity(level):
	var bays=3+level*2
	if level>=2:
		arcade(Vector3(0,0,-11),bays)
		if level==3:arcade(Vector3(-26,0,1),8,PI*.5);arcade(Vector3(26,0,1),8,-PI*.5)
	for j in level*3:
		var x=(j%(level+1)-level*.5)*5.3;var z=(floori(j/float(level+1)))*5.5+2
		for side in [-1.,1.]:beam(Vector3(x+side*1.8,0,z),Vector3(x+side*1.8,2.7,z),.12,3)
		cloth(Vector3(x-2,2.8,z-2),Vector3(x+2,2.8,z-2),Vector3(x+2,2.5,z+2),Vector3(x-2,2.5,z+2),6 if j%2 else 4)
		box(Vector3(x,.8,z),Vector3(3.2,1.6,1.5),3)
		for i in 5:pot(Vector3(x+(i-2)*.55,1.65,z),.45)
func cavea(p,rx,rz,rows,ellipse=false):
	var segments=40 if ellipse else 28
	for row in rows:
		var r0=1.+row*.065;var r1=r0+.06;var y=.3+row*.42
		for j in segments:
			var a=(TAU if ellipse else PI)*j/segments;var b=(TAU if ellipse else PI)*(j+1)/segments
			var v0=p+Vector3(cos(a)*rx*r0,y,sin(a)*rz*r0);var v1=p+Vector3(cos(b)*rx*r0,y,sin(b)*rz*r0)
			var v2=p+Vector3(cos(b)*rx*r1,y,sin(b)*rz*r1);var v3=p+Vector3(cos(a)*rx*r1,y,sin(a)*rz*r1)
			quad(v0,v1,v2,v3,2 if rows>5 else 3);quad(v0+Vector3.DOWN*.42,v1+Vector3.DOWN*.42,v1,v0,2 if rows>5 else 3)
func spectacle_identity(level):
	if level<3:
		cavea(Vector3(0,0,-4),9 if level==1 else 14,9 if level==1 else 13,4 if level==1 else 9)
		var width=19. if level==1 else 31.
		box(Vector3(0,1.1,-6),Vector3(width,2.2,7),3)
		if level==2:
			wing(Vector3(0,0,-12),32,7,7,1,false,false)
			for x in [-12.,-6.,0.,6.,12.]:column(Vector3(x,2,-7.5),5,.28,2)
		return
	cavea(Vector3.ZERO,18,12,12,true)
	# Original elliptical arena, two rows of actual arcaded openings.
	for row in 2:
		for j in 36:
			var a=TAU*j/36;var p=Vector3(cos(a)*29.3,row*4.1,sin(a)*21.0)
			var normal=Vector3(cos(a)/29.3,0,sin(a)/21.).normalized();var angle=atan2(normal.x,normal.z)
			var saved=frame;frame=saved*Transform3D(Basis(Vector3.UP,angle),p)
			arch(Vector3.ZERO,3.0 if abs(sin(a))>.5 else 2.4,2.0,.35,1.0)
			box(Vector3(0,3.8,0),Vector3(4.7,.35,1.3),2);frame=saved
func urban_block(variant):
	if variant==2:
		# Narrow street houses with alternating party-wall heights and roof directions.
		for j in 3:
			wing(Vector3(-11+j*10,0,-4),8.5,23,5.5+j*.7,2,j==1,j%2==0)
		wing(Vector3(1,0,13),30,6,3.6,1,true)
		for j in 3:pot(Vector3(-10+j*8,0,5),.9)
		return
	if variant==4:
		# Taller corner frontage and lower rear service courts; not another U block.
		wing(Vector3(-10,0,-4),10,27,8.8,3,true,false)
		wing(Vector3(5,0,-12),20,9,5.8,2,false,true)
		wing(Vector3(12,0,8),8,15,3.6,1,false,true)
		arcade(Vector3(-1,0,12),4)
		for j in 4:pot(Vector3(-3+j*2.1,0,2),.75)
		return
	if variant==5:
		# Closed atrium frontage with a projecting shop row and two small courts.
		wing(Vector3(-13,0,-2),7,32,5.8,2,false,true)
		wing(Vector3(12,0,-2),7,32,4.8,1,false,false)
		wing(Vector3(0,0,-15),19,6,4.5,1,false,true)
		wing(Vector3(0,0,14),20,7,5.8,2,true,false)
		for j in 4:column(Vector3(-7,0,-7+j*4),3.5,.18,3)
		box(Vector3(-7,3.6,-1),Vector3(.35,.35,14),3)
		for j in 6:pot(Vector3(-4+j*1.5,0,6),.7)
		return
	var h=5.7+float(variant%3)*.8
	wing(Vector3(-13,0,0),7.5,32,h,2,false,variant%2==0)
	wing(Vector3(10,0,-9),10,15,6.6 if variant>=3 else 4.3,2 if variant>=3 else 1,false,variant%3==0)
	wing(Vector3(2,0,13),19,7,4.2,1,variant%2==1)
	wing(Vector3(-2,0,-17),19,7,5.2,1,false,true)
	wing(Vector3(14,0,10),6,11,3.2)
	box(Vector3(-2,.1,0),Vector3(12,.2,17),2)
	box(Vector3(-2,.22,-1),Vector3(2.6,.24,3.5),2);box(Vector3(-2,.36,-1),Vector3(2.2,.03,3.1),7)
	if variant%2==0:
		for j in 5:column(Vector3(-8,0,-7+j*3.4),3.2,.17,3)
		box(Vector3(-8,3.3,0),Vector3(.35,.4,16),3)
	else:arcade(Vector3(3,0,17),4)
	for j in 5:pot(Vector3(-6+j*1.8,0,6),.8)
func rural_cluster(variant):
	rural_house(Vector3(-5,0,-3),9+variant,13,3.8)
	if variant!=1:wing(Vector3(7,0,-7),7,8,2.7,1,false,true)
	grain_house(Vector3(7,0,6),4.5,6,2.5)
	for j in 5:pot(Vector3(-6+j*1.2,0,7),.75)
func crop_tuft():
	for j in 6:
		var a=j*2.399;var p=Vector3(cos(a)*.16,0,sin(a)*.16);var top=p+Vector3(.06,.58+rng.randf()*.18,.02)
		beam(p,top,.022,6)
		for side in [-1.,1.]:beam(top-Vector3.UP*.14,top+Vector3(side*.10,.05,0),.045,6)
