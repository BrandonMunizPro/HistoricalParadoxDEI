extends RefCounted
## Original Roma presentation meshes. Authored in metres, saved in kilometres.
## Interpreted Italic domestic/ritual architecture, not an archaeological survey.
const FOLDER="res://assets/roma-showcase/"
var mats=[]
var tools=[]
var rng=RandomNumberGenerator.new()
var color=Color.WHITE
var faces=0
var frame=Transform3D.IDENTITY
var simplified=false
func pbr(name,stem,tint,scale_value=400.0):
	var m=StandardMaterial3D.new();m.albedo_color=Color(tint)
	m.albedo_texture=load(stem+"-color.jpg");m.normal_enabled=true;m.normal_texture=load(stem+"-normal.jpg");m.normal_scale=.35
	m.roughness_texture=load(stem+"-roughness.jpg");m.roughness_texture_channel=BaseMaterial3D.TEXTURE_CHANNEL_RED
	m.uv1_triplanar=false;m.uv1_scale=Vector3.ONE;m.texture_filter=BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	m.vertex_color_use_as_albedo=true;m.cull_mode=BaseMaterial3D.CULL_BACK
	ResourceSaver.save(m,FOLDER+name+".tres");mats.append(m)
func flat(name,tint,roughness=.85):
	var m=StandardMaterial3D.new();m.albedo_color=Color(tint);m.roughness=roughness;m.vertex_color_use_as_albedo=true;m.cull_mode=BaseMaterial3D.CULL_DISABLED
	ResourceSaver.save(m,FOLDER+name+".tres");mats.append(m)
func materials():
	pbr("plaster",FOLDER+"plaster","e3d4b6",420) # 0
	pbr("clay",FOLDER+"roof","eee2ce",240) # 1
	pbr("tuff",FOLDER+"stone","d4c5a7",500) # 2
	pbr("timber",FOLDER+"timber","8b775d",650) # 3
	flat("red-ochre","8e4531") # 4
	flat("interior","272922") # 5
	flat("linen","c3b28b") # 6
	flat("water","4b6559",.3) # 7
	flat("leaf","526337") # 8
	flat("charcoal","463e31") # 9
	var leaves=StandardMaterial3D.new();leaves.albedo_texture=load(FOLDER+"holm-oak-branch.png");leaves.vertex_color_use_as_albedo=true
	leaves.transparency=BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR;leaves.alpha_scissor_threshold=.45
	leaves.alpha_antialiasing_mode=BaseMaterial3D.ALPHA_ANTIALIASING_ALPHA_TO_COVERAGE
	leaves.cull_mode=BaseMaterial3D.CULL_DISABLED;leaves.roughness=.82;leaves.backlight_enabled=true;leaves.backlight=Color(.22,.25,.12)
	leaves.texture_filter=BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	ResourceSaver.save(leaves,FOLDER+"leaf.tres");mats[8]=leaves
func begin(seed_value=1,far=false):
	rng.seed=seed_value;tools=[];faces=0;frame=Transform3D.IDENTITY;simplified=far
	for m in mats:
		var s=SurfaceTool.new();s.begin(Mesh.PRIMITIVE_TRIANGLES);s.set_material(m);tools.append(s)
func finish(name):
	var mesh=ArrayMesh.new()
	for s in tools:
		var a=s.commit_to_arrays()
		if a[Mesh.ARRAY_VERTEX]!=null and a[Mesh.ARRAY_VERTEX].size()>0:
			s.generate_tangents();s.index();s.commit(mesh)
	ResourceSaver.save(mesh,FOLDER+name+".res")
	var bounds=mesh.get_aabb()
	return {"name":name,"surfaces":mesh.get_surface_count(),"triangles":faces,"boundsKm":[bounds.position.x,bounds.position.z,bounds.size.x,bounds.size.z]}
func tri(a,b,c,index,uv_a=Vector2.ZERO,uv_b=Vector2.RIGHT,uv_c=Vector2.ONE):
	var n=(b-a).cross(c-a).normalized();var st=tools[index]
	# Godot's front faces are clockwise; preserve the outward shading normal.
	for entry in [[a,uv_a],[c,uv_c],[b,uv_b]]:
		st.set_normal(frame.basis*n);st.set_color(color);st.set_uv(entry[1] if index==8 else planar_uv(entry[0],n,index));st.add_vertex((frame*entry[0])*.001)
	faces+=1
func quad(a,b,c,d,index):
	tri(a,b,c,index,Vector2(0,0),Vector2(1,0),Vector2(1,1));tri(a,c,d,index,Vector2(0,0),Vector2(1,1),Vector2(0,1))
func box(p,size,index):
	var mesh=BoxMesh.new();mesh.size=size;var a=mesh.get_mesh_arrays();var st=tools[index]
	for i in a[Mesh.ARRAY_INDEX]:
		var n=a[Mesh.ARRAY_NORMAL][i];var v=a[Mesh.ARRAY_VERTEX][i]+p
		st.set_normal(frame.basis*n);st.set_uv(planar_uv(v,n,index));st.set_color(color);st.add_vertex((frame*v)*.001)
	faces+=a[Mesh.ARRAY_INDEX].size()/3
func planar_uv(v,n,index):
	var scale_value=.25 if index==1 else (.4 if index==0 else .5)
	if index==1 and abs(n.y)>.5:return Vector2(v.z,abs(v.x))*.25
	if abs(n.y)>.5:return Vector2(v.x,v.z)*scale_value
	if abs(n.x)>.5:return Vector2(v.z,-v.y)*scale_value
	return Vector2(v.x,-v.y)*scale_value
func beam(a,b,width,index):
	var axis=(b-a).normalized();var right=axis.cross(Vector3.FORWARD).normalized()
	if right.length()<.1:right=axis.cross(Vector3.RIGHT).normalized()
	var side=axis.cross(right).normalized();var r=right*width*.5;var s=side*width*.5
	quad(a-r+s,b-r+s,b+r+s,a+r+s,index);quad(a+r-s,b+r-s,b-r-s,a-r-s,index)
	quad(a+r+s,b+r+s,b+r-s,a+r-s,index);quad(a-r-s,b-r-s,b-r+s,a-r+s,index)
func tube(p,r,h,index,r_top=-1.0,segments=12):
	if r_top<0:r_top=r
	for i in segments:
		var a=TAU*i/segments;var b=TAU*(i+1)/segments
		var v=Vector3(cos(a),0,sin(a));var w=Vector3(cos(b),0,sin(b))
		quad(p+v*r,p+v*r_top+Vector3.UP*h,p+w*r_top+Vector3.UP*h,p+w*r,index)
		tri(p+Vector3.UP*h,p+w*r_top+Vector3.UP*h,p+v*r_top+Vector3.UP*h,index)
func pot(p,size_value=1.0,index=1):
	if simplified:return
	var last=0.0;var radii=[.10,.28,.36,.30,.12,.15]
	for i in 5:
		tube(p+Vector3.UP*last,radii[i]*size_value,.18*size_value,index,radii[i+1]*size_value,10);last+=.18*size_value
	tube(p+Vector3.UP*last,.15*size_value,.05*size_value,index,.15*size_value,10)
	box(p+Vector3(0,last+.01,0),Vector3(.17,.02,.17)*size_value,5)
func cloth(a,b,c,d,index):
	var nx=8;var nz=3
	for x in nx:
		for z in nz:
			var points=[]
			for q in [Vector2(float(x)/nx,float(z)/nz),Vector2(float(x+1)/nx,float(z)/nz),Vector2(float(x+1)/nx,float(z+1)/nz),Vector2(float(x)/nx,float(z+1)/nz)]:
				var p=a.lerp(b,q.x).lerp(d.lerp(c,q.x),q.y)
				p.y-=sin(q.x*PI)*sin(q.y*PI)*.22
				points.append(p)
			quad(points[0],points[1],points[2],points[3],index)
func capitals(p,r):
	tube(p,r*1.3,.16,2,r*1.3,16);tube(p+Vector3.UP*.16,r*1.25,.20,2,r*.96,16)
	box(p+Vector3(0,.42,0),Vector3(r*3,.28,r*3),2)
func column(p,height,r,index=0):
	tube(p,r*1.35,.18,2,r*1.35,16);tube(p+Vector3.UP*.18,r*1.2,.18,2,r,16)
	var rings=3 if simplified else 8
	for i in rings:
		var t=float(i)/rings;var t1=float(i+1)/rings
		var r0=r*(1-.17*t+.06*sin(t*PI));var r1=r*(1-.17*t1+.06*sin(t1*PI))
		tube(p+Vector3.UP*(.36+(height-.9)*t),r0,(height-.9)/rings,index,r1,16)
	capitals(p+Vector3.UP*(height-.55),r)
func roof(p,w,l,rise,hip=false):
	var e=.6;var x=w*.5+e;var z=l*.5+e;var ridge=max(0,z-(x if hip else 0))
	quad(p+Vector3(-x,0,-z),p+Vector3(-x,0,z),p+Vector3(0,rise,ridge),p+Vector3(0,rise,-ridge),1)
	quad(p+Vector3(x,0,z),p+Vector3(x,0,-z),p+Vector3(0,rise,-ridge),p+Vector3(0,rise,ridge),1)
	if hip:
		tri(p+Vector3(-x,0,z),p+Vector3(x,0,z),p+Vector3(0,rise,ridge),1)
		tri(p+Vector3(x,0,-z),p+Vector3(-x,0,-z),p+Vector3(0,rise,-ridge),1)
	else:
		for sign_value in [-1.0,1.0]:
			var a=p+Vector3(-w*.5,0,sign_value*l*.5);var b=p+Vector3(w*.5,0,sign_value*l*.5);var c=p+Vector3(0,rise,sign_value*l*.5)
			if sign_value>0:tri(a,b,c,0)
			else:tri(b,a,c,0)
	for sign_value in [-1.0,1.0]:
		beam(p+Vector3(sign_value*x,-.1,-z),p+Vector3(sign_value*x,-.1,z),.22,3)
	if simplified:return
	# Raised curved imbrices descend the roof slope; ridge caps have real silhouettes.
	var runs=ceili(l/.72)
	for j in runs:
		var zz=-l*.5+(j+.5)*l/runs
		for side in [-1.0,1.0]:
			if hip and abs(zz)>ridge:continue
			var a=p+Vector3(side*x,.05,zz);var b=p+Vector3(0,rise+.05,zz)
			var length_value=a.distance_to(b);var dir=(b-a).normalized();var perp=Vector3.FORWARD
			for k in 4:
				var angle0=PI*k/4;var angle1=PI*(k+1)/4
				var q0=perp*cos(angle0)*.085+Vector3.UP*sin(angle0)*.085
				var q1=perp*cos(angle1)*.085+Vector3.UP*sin(angle1)*.085
				quad(a+q0,a+q1,a+q1+dir*length_value,a+q0+dir*length_value,1)
	for j in ceili(max(1.0,ridge*2)/.7):
		var zz=-ridge+j*.7
		beam(p+Vector3(0,rise+.15,zz),p+Vector3(0,rise+.15,min(zz+.65,ridge)),.24,1)
func facade(p,width,height,front,shop=false,upper=false):
	var bays=maxi(1,roundi(width/3.2));var step=width/bays
	for i in bays:
		var x=(i+.5)*step-width*.5;var opening=1.25 if upper else (step*.75 if shop else 1.25)
		var bottom=1.0 if upper else 0.0;var top=2.25 if upper else 2.7
		var z=front
		box(p+Vector3(x-step*.5+(step-opening)*.25,height*.5,z),Vector3((step-opening)*.5,height,.42),0)
		box(p+Vector3(x+step*.5-(step-opening)*.25,height*.5,z),Vector3((step-opening)*.5,height,.42),0)
		box(p+Vector3(x,(height+top)*.5,z),Vector3(opening,height-top,.42),0)
		if bottom>0:box(p+Vector3(x,bottom*.5,z),Vector3(opening,bottom,.42),0)
		box(p+Vector3(x,(top+bottom)*.5,z-.30),Vector3(opening,top-bottom,.08),5)
		if simplified:continue
		if not shop:
			for side in [-1.0,1.0]:
				box(p+Vector3(x+side*opening*.37,(top+bottom)*.5,z-.08),Vector3(opening*.25,top-bottom-.12,.11),3)
			for y in [bottom+.2,top-.2]:box(p+Vector3(x,y,z+.06),Vector3(opening+.18,.10,.14),3)
		box(p+Vector3(x,top+.08,z+.05),Vector3(opening+.32,.17,.56),2)
		if upper:box(p+Vector3(x,bottom-.1,z+.13),Vector3(opening+.3,.18,.7),2)
		if shop:
			box(p+Vector3(x,.8,z+.15),Vector3(opening*.8,.16,.7),3)
			for k in 4:pot(p+Vector3(x+(k-1.5)*.45,.9,z+.15),rng.randf_range(.35,.6))
func wing(p,w,l,h,stories=1,shop=false,hip=false):
	color=Color.from_hsv(.08+rng.randf()*.025,.05+rng.randf()*.08,.80+rng.randf()*.2)
	box(p+Vector3(0,.3,0),Vector3(w+.25,.6,l+.25),2)
	var floor_h=h/stories
	for level in stories:facade(p+Vector3.UP*(level*floor_h),w,floor_h,l*.5,shop and level==0,level>0)
	# Every visible elevation has constructed window openings and shaded reveals.
	var saved_frame=frame
	for turn in [PI,PI*.5,-PI*.5]:
		frame=saved_frame*Transform3D(Basis(Vector3.UP,turn),p)
		var span=w if is_equal_approx(turn,PI) else l
		var depth=l if is_equal_approx(turn,PI) else w
		for level in stories:facade(Vector3.UP*(level*floor_h),span,floor_h,depth*.5,false,true)
	frame=saved_frame
	for side in [-1.0,1.0]:box(p+Vector3(side*(w*.5+.02),.55,0),Vector3(.06,.5,l+.05),4)
	for y in [h-.2,3.2 if stories>1 else .6]:box(p+Vector3(0,y,l*.5+.09),Vector3(w+.18,.15,.24),3 if y>1 else 4)
	color=Color(1,1,1);roof(p+Vector3.UP*h,w,l,w*.25,hip)
func residence(variant):
	var w=12.2+float(variant%3)*1.2;var l=15.0+float(variant%2)*1.8
	var stories=2 if variant%3!=0 else 1;var height=6.0 if stories==2 else 3.8
	wing(Vector3.ZERO,w,l,height,stories,variant==4,variant%2==0)
	# Attached rear service wing, courtyard wall, real gates and rough timber pergola.
	if variant%2==0:
		wing(Vector3(-w*.35,0,-l*.68),w*.5,l*.5,3.2)
	if variant==0:
		for side in [-1.0,1.0]:box(Vector3(side*(w*.5+2.8),.55,-2),Vector3(.35,1.1,l+8),2)
		box(Vector3(0,.55,-l*.5-6),Vector3(w+5.6,1.1,.35),2)
	if variant%2==1:wing(Vector3(-w*.30,0,-l*.58),w*.60,l*.5,3.4)
	for j in 4:
		var x=-w*.45+j*w*.3
		beam(Vector3(x,0,l*.5+2.8),Vector3(x,2.75,l*.5+2.8),.15,3)
		beam(Vector3(x,2.75,l*.5-.1),Vector3(x,2.75,l*.5+3),.12,3)
	cloth(Vector3(-w*.5,2.85,l*.5),Vector3(w*.5,2.85,l*.5),Vector3(w*.5,2.55,l*.5+3),Vector3(-w*.5,2.55,l*.5+3),6)
	for j in 4:pot(Vector3(w*.45+j*.45,0,l*.4),rng.randf_range(.55,.95))
func atrium(variant):
	var w=20.0+variant*1.5;var l=23.0
	wing(Vector3(-w*.38,0,0),w*.25,l,4.4)
	wing(Vector3(w*.38,0,0),w*.25,l,4.4)
	wing(Vector3(0,0,-l*.38),w*.5,l*.25,4.2)
	wing(Vector3(0,0,l*.38),w*.5,l*.25,4.2,1,true)
	box(Vector3(0,.10,0),Vector3(w*.5,.2,l*.5),2)
	box(Vector3(0,.24,-1),Vector3(3.2,.20,4.0),2);box(Vector3(0,.35,-1),Vector3(2.8,.025,3.6),7)
	for side in [-1.0,1.0]:
		for j in 4:column(Vector3(side*w*.23,0,(j-1.5)*3),3.25,.18,3)
		box(Vector3(side*w*.23,3.3,0),Vector3(.28,.35,11),3)
	for j in 6:pot(Vector3(-3+j*1.1,.2,-5),rng.randf_range(.6,1.1))
func shops(variant):
	wing(Vector3.ZERO,19,9,4.0,1,true)
	for side in [-1.0,1.0]:
		beam(Vector3(side*9,0,8),Vector3(side*9,3.3,8),.18,3)
	cloth(Vector3(-9.6,3.9,4.6),Vector3(9.6,3.9,4.6),Vector3(9.6,3.0,8.3),Vector3(-9.6,3.0,8.3),6 if variant==0 else 4)
	for i in 10:
		var x=-8+i*1.8
		box(Vector3(x,.65,7),Vector3(1.4,1.3,1.0),3)
		for j in 3:pot(Vector3(x+(j-1)*.4,1.3,7),rng.randf_range(.3,.5))
func workshop(variant):
	wing(Vector3(-5,0,0),7,17,4.1)
	wing(Vector3(3,0,-5),9,7,3.2,1,true)
	tube(Vector3(4,0,3),2.3,1.8,2,2.1,20);tube(Vector3(4,1.8,3),2.1,1.3,1,.7,20);tube(Vector3(4,3.1,3),.7,.65,1,.6,16)
	for j in 14:
		pot(Vector3(1.5+(j%4)*.9,0,7+floori(j/4.0)*.9),rng.randf_range(.6,1.1))
	for j in 6:beam(Vector3(-1,0,-1+j*.4),Vector3(5,0,-1+j*.4),.25,3)
	if variant==1:
		for j in 3:box(Vector3(5,.45+j*.5,0),Vector3(4,.4,.4),3)
func warehouse():
	wing(Vector3.ZERO,15,28,5.6,1,true)
	for i in 4:box(Vector3(0,.1+i*.15,16-i*.4),Vector3(8,.2,.5),2)
	for side in [-1.0,1.0]:
		for j in 7:beam(Vector3(side*7.6,.6,-12+j*4),Vector3(side*7.6,5.5,-12+j*4),.30,3)
	for i in 20:pot(Vector3(-5+(i%5)*1.1,.6,8+floori(i/5.0)*1.1),1.0)
func temple():
	# Tuscan/Italic interpretation: three cellae, deep porch, terracotta and timber.
	if simplified:
		for i in 5:box(Vector3(0,.3+i*.5,-4),Vector3(54-i*.32,.6,62-i*.32),2)
	else:
		for row in 5:
			for side in [-1.0,1.0]:
				for i in 26:
					color=Color.from_hsv(.09,.05,rng.randf_range(.85,1.0));box(Vector3(-27+(i+.5)*54/26,.3+row*.5,-4+side*30.5),Vector3(54.0/26-.025,.49,1.0),2)
				for i in 30:
					color=Color.from_hsv(.09,.05,rng.randf_range(.85,1.0));box(Vector3(side*26.5,.3+row*.5,-35+(i+.5)*62/30),Vector3(1.0,.49,62.0/30-.025),2)
		color=Color.WHITE;box(Vector3(0,2.55,-4),Vector3(54,.15,62),2)
	for i in 12:box(Vector3(0,.13+i*.23,32-i*.62),Vector3(28,.26,.70),2)
	for x in [-16.0,0.0,16.0]:
		box(Vector3(x,8,-15),Vector3(15,11,27),0)
		box(Vector3(x,6.5,-1.4),Vector3(4.2,7.5,.12),5)
		for side in [-1.0,1.0]:box(Vector3(x+side*2.2,6.5,-1),Vector3(.25,8,.45),3)
	for z in [4.0,15.0,26.0]:
		for x in [-22.0,-13.2,-4.4,4.4,13.2,22.0]:column(Vector3(x,2.5,z),11.0,.78,0)
	box(Vector3(0,13.7,-2),Vector3(55,1.0,65),3)
	for y in [13.4,14.1,15.2]:box(Vector3(0,y,30.7),Vector3(56,.25,.5),4)
	for j in 44:
		var x=-27+j*1.25
		box(Vector3(x,14.65,30.7),Vector3(.55,.65,.35),2)
		box(Vector3(x,15.25,31),Vector3(.25,.35,.6),4)
	box(Vector3(0,15.3,-2),Vector3(58,.5,67),2)
	roof(Vector3(0,15.6,-2),59,68,10.0)
	# Triangular openwork timber pediment and polychrome terracotta edge.
	for z in [-36.4,32.4]:
		beam(Vector3(-29,15.9,z),Vector3(0,25.5,z),.45,4);beam(Vector3(0,25.5,z),Vector3(29,15.9,z),.45,4)
		for j in 15:
			var x=-26+j*3.7;var h=10*(1-abs(x)/29)
			beam(Vector3(x,16,z+.05),Vector3(x,16+h,z+.05),.2,3)
	for side in [-1.0,1.0]:
		for j in 36:
			var z=-35+j*1.9
			tube(Vector3(side*30,15.65,z),.20,.7,1,.28,10)
	for i in 6:pot(Vector3(-15+i*6,2.6,28),1.0)
func wall():
	for row in 10:
		for j in 13:
			var z=-8+j*1.25+float(row%2)*.625
			color=Color.from_hsv(.095,.12,rng.randf_range(.72,1.0));box(Vector3(0,.32+row*.62,z),Vector3(2.5,.59,1.22),2)
	color=Color.WHITE;box(Vector3(0,6.25,0),Vector3(2.65,.25,17),2)
	for j in 7:box(Vector3(0,6.85,-7+j*2.25),Vector3(2.6,1.0,1.05),2)
func paving():
	# Rough local stone landing, not a blanket of Imperial marble paving.
	for iz in 10:
		for ix in 7:
			var p=Vector3((ix-3)*.83+(iz%2)*.3,0,(iz-4.5)*.8)
			var corners=[];var w=.39;var l=.36
			for q in [Vector2(-w+.06,-l),Vector2(w-.06,-l),Vector2(w,-l+.06),Vector2(w,l-.06),Vector2(w-.06,l),Vector2(-w+.06,l),Vector2(-w,l-.06),Vector2(-w,-l+.06)]:corners.append(p+Vector3(q.x+rng.randf_range(-.025,.025),rng.randf_range(.025,.06),q.y+rng.randf_range(-.025,.025)))
			color=Color.from_hsv(.09,.12,rng.randf_range(.7,1.0))
			for i in 8:
				var a=corners[i];var b=corners[(i+1)%8]
				tri(p+Vector3.UP*.04,b,a,2);quad(a,b,Vector3(b.x,-.07,b.z),Vector3(a.x,-.07,a.z),2)
	color=Color.WHITE
func civic():
	wing(Vector3(0,0,-3),25,16,6.0,1,false,true)
	for x in [-10.0,-6.0,-2.0,2.0,6.0,10.0]:column(Vector3(x,0,10),4.2,.28,3)
	box(Vector3(0,4.4,9),Vector3(26,.5,6),3);roof(Vector3(0,4.7,9),26,6,2)
	for i in 4:box(Vector3(0,.08+i*.18,13-i*.4),Vector3(26,.2,.5),2)
	for side in [-1.0,1.0]:box(Vector3(side*13.5,.7,8),Vector3(.5,1.4,8),2)
func tree(variant,coarse=false):
	# Gnarled, forked evergreen; leaves use individual curved silhouettes, no crown blobs.
	var height=7.5+variant*.8;var tips=[]
	var bark=3
	tube(Vector3.ZERO,.42,height*.45,bark,.20,12)
	for j in 9:
		var angle=j*2.399+variant*.6;var base=Vector3(0,height*.26,0)
		var tip=Vector3(cos(angle)*rng.randf_range(1.5,3.3),height*rng.randf_range(.65,1.0),sin(angle)*rng.randf_range(1.5,3.3))
		beam(base,tip,.19,bark)
		for k in 5:
			var a=angle+k*1.6;var q=tip+Vector3(cos(a)*1.8,rng.randf_range(-.7,.7),sin(a)*1.8)
			beam(tip*.8+base*.2,q,.065,bark);tips.append(q)
	for tip in tips:
		for j in (5 if coarse else 13):
			var p=tip+Vector3(rng.randf_range(-1.1,1.1),rng.randf_range(-.7,.7),rng.randf_range(-1.1,1.1))
			var a=rng.randf()*TAU;var side=Vector3(cos(a),rng.randf_range(-.3,.3),sin(a))*.9
			var up=Vector3(-sin(a)*.2,.8,cos(a)*.2)
			color=Color.from_hsv(.13+rng.randf()*.1,.04+rng.randf()*.08,.85+rng.randf()*.15)
			quad(p-side-up,p+side-up,p+side+up,p-side+up,8)
	color=Color.WHITE
