shader_type spatial;
render_mode cull_disabled;
#include "res://habitat.gdshaderinc"
varying vec3 position_world;
varying float crown_height;
varying float stand_proxy;
uniform float camera_distance=1000.0;
uniform vec2 coarse_transition_km=vec2(8.0,35.0);
uniform vec2 local_transition_km=vec2(12.0,32.0);
uniform bool woody=false;
void vertex(){
 crown_height=VERTEX.y;
 stand_proxy=INSTANCE_CUSTOM.x;
 // Coarse canopy proxies shrink continuously as the existing local cells take
 // over. Instance origins stay on sampled terrain; no terrain is displaced.
 float proxy=smoothstep(coarse_transition_km.x,coarse_transition_km.y,camera_distance);
 VERTEX*=mix(1.0,proxy,INSTANCE_CUSTOM.x);
 VERTEX*=mix(1.0,1.0-smoothstep(local_transition_km.x,local_transition_km.y,camera_distance),INSTANCE_CUSTOM.y);
 VERTEX.y+=VERTEX.x*INSTANCE_CUSTOM.z+VERTEX.z*INSTANCE_CUSTOM.w;
 position_world=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;
}
void fragment(){
 if(woody){ALBEDO=pow(COLOR.rgb,vec3(2.0));ROUGHNESS=1.0;SPECULAR=.02;}
 else{
 float leaves=sin(position_world.x*2700.0+sin(position_world.z*2300.0))*sin(position_world.y*3200.0);
 float interior=mix(.62,1.08,smoothstep(.006,.026,crown_height));
 ALBEDO=pow(COLOR.rgb,vec3(1.32))*interior*(.96+leaves*.04);
 ALBEDO*=mix(1.0,.74+habitat_noise(position_world.xz*9.0)*.52,stand_proxy);
 ROUGHNESS=.94;SPECULAR=.06;
 BACKLIGHT=ALBEDO*.12;
 }
}
