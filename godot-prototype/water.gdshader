shader_type spatial;
render_mode cull_disabled, depth_draw_never;
#include "res://shoreline.gdshaderinc"
uniform sampler2D strategic_land : filter_linear, repeat_disable;
uniform sampler2D shore_mask : filter_linear, repeat_disable;
uniform sampler2D regional_ocean : filter_linear, repeat_disable;
uniform sampler2D regional_shore : filter_linear, repeat_disable;
uniform sampler2D regional_land : filter_linear, repeat_disable;
uniform sampler2D global_land : filter_linear, repeat_disable;
uniform sampler2D global_ocean : filter_linear, repeat_disable;
uniform sampler2D global_shore : filter_linear, repeat_disable;
uniform float camera_distance=500.0;
uniform float water_time=0.0;
uniform float animation_speed=1.0;
uniform float wave_strength=.10;
uniform float roughness=.30;
uniform float specular_strength=.55;
uniform float fresnel_strength=.12;
uniform float foam_strength=.055;
uniform float coastal_band_km=4.0;
uniform vec3 deep_color=vec3(.018,.085,.13);
uniform vec3 coastal_color=vec3(.045,.24,.23);
varying vec3 world_pos;
void vertex(){world_pos=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;}
// Analytic gradients at independent wavelengths/directions. Filter subpixel waves
// before lighting so distant highlights do not sparkle or alias into stripes.
vec2 wave_gradient(vec2 p,vec2 k,float speed,float phase,float amplitude,float t){
 float crossing=dot(p,vec2(-k.y,k.x))*.31+phase+t*.07;
 float along=dot(p,k)*.43+phase;
 float angle=dot(p,k)+sin(crossing)*.35+sin(along)*.2+t*speed+phase;
 float visible=1.0-smoothstep(.7,2.5,fwidth(angle));
 vec2 direction=k*(1.0+cos(along)*.086)+vec2(-k.y,k.x)*cos(crossing)*.1085;
 return normalize(direction)*cos(angle)*amplitude*visible;
}
void fragment(){
 vec2 geo=coast_geographic(world_pos.xz),q=vec2((geo.x-6.0)/14.0,(49.0-geo.y)/14.0);
 bool region=all(greaterThanEqual(q,vec2(0.0)))&&all(lessThanEqual(q,vec2(1.0)));
 vec2 rq=(q*7168.0+.5)/7169.0;
 vec2 global_uv=vec2((geo.x+12.0)/87.0,(62.0-geo.y)/50.0);
 bool inside=all(greaterThanEqual(global_uv,vec2(0.0)))&&all(lessThanEqual(global_uv,vec2(1.0)));
 vec2 gq=(global_uv*vec2(11136.0,6400.0)+.5)/vec2(11137.0,6401.0);
 float land=region?texture(regional_ocean,rq).r:(inside?texture(global_ocean,gq).r:0.0);
 if(camera_distance>2800.0)land=mix(land,inside?texture(shore_mask,global_uv).r:0.0,smoothstep(2800.0,4000.0,camera_distance));
 float ground=region?texture(regional_land,rq).r:(inside?texture(global_land,gq).r:0.0);
 if(camera_distance>2800.0)ground=mix(ground,inside?texture(strategic_land,global_uv).r:0.0,smoothstep(2800.0,4000.0,camera_distance));
 // Keep sea under opaque land: elevated coast edges otherwise reveal the
 // background through parallax gaps. Inland water exclusions remain intact.
 if(land>.5&&ground<.5)discard;
 vec2 sq=(global_uv*vec2(2784.0,1600.0)+.5)/vec2(2785.0,1601.0);
 // Regional distance stores source pixels; global distance already stores km.
 float d=region?texture(regional_shore,rq).r*63.75*(111.195/512.0):(inside?texture(global_shore,sq).r*63.75:64.0);
 // Shore distance controls appearance only: it is not a bathymetric depth estimate.
 float shallow=exp(-d/max(.1,coastal_band_km));
 vec2 p=world_pos.xz;
 float t=water_time*animation_speed;
 vec2 waves=wave_gradient(p,vec2(8.7,5.1),.24,0.0,.12,t);
 waves+=wave_gradient(p,vec2(-11.9,17.1),-.19,1.7,.09,t);
 float fine_weight=1.0-smoothstep(150.0,500.0,camera_distance);
 if(fine_weight>0.0){
  waves+=wave_gradient(p,vec2(93.0,81.0),.71,2.4,.34,t)*fine_weight;
  waves+=wave_gradient(p,vec2(-231.0,310.0),-.53,.8,.23,t)*fine_weight;
  waves+=wave_gradient(p,vec2(410.0,170.0),1.1,3.0,.14,t)*fine_weight;
 }
 vec3 normal_world=normalize(vec3(-waves.x*wave_strength,1.0,-waves.y*wave_strength));
 NORMAL=normalize(mat3(VIEW_MATRIX)*normal_world);
 float fresnel=pow(1.0-clamp(dot(NORMAL,VIEW),0.0,1.0),5.0);
 ALBEDO=mix(deep_color,coastal_color,shallow*.65);
 ALBEDO=mix(ALBEDO,vec3(.24,.34,.38),fresnel*fresnel_strength);
 // Restrained shore-distance wash, close views only. Never changes alpha/masks.
 float foam=exp(-d*2.5)*(1.0-smoothstep(40.0,180.0,camera_distance));
 float wash=.65+.35*sin(d*9.0-t*.65+sin(p.x*.4+p.y*.6));
 ALBEDO=mix(ALBEDO,vec3(.46,.54,.49),foam*wash*foam_strength);
 ROUGHNESS=mix(roughness,min(.55,roughness+.15),smoothstep(150.0,1600.0,camera_distance));
 SPECULAR=specular_strength;
}
