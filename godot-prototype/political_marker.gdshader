shader_type spatial;
render_mode unshaded,cull_disabled,depth_test_disabled,fog_disabled,shadows_disabled;
global uniform float political_blend;
uniform float marker_size=1.;
varying float selected;
void vertex(){
 vec3 center=(VIEW_MATRIX*MODEL_MATRIX*vec4(0.,0.,0.,1.)).xyz;
 POSITION=PROJECTION_MATRIX*vec4(center+vec3(VERTEX.xy*marker_size,0.),1.);
 selected=INSTANCE_CUSTOM.r;
}
void fragment(){
 float r=length(UV-.5);float aa=max(fwidth(r),.01);
 ALPHA=(1.-smoothstep(.46-aa,.46+aa,r))*political_blend;
 ALBEDO=mix(vec3(.025,.035,.04),mix(vec3(.74,.75,.74),vec3(.98,.80,.42),selected),1.-smoothstep(.23-aa,.23+aa,r));
}
