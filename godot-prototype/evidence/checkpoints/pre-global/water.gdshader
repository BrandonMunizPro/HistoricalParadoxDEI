shader_type spatial;
render_mode cull_disabled, depth_draw_never;
uniform sampler2D shore_mask : filter_linear, repeat_disable;
uniform sampler2D regional_ocean : filter_linear, repeat_disable;
uniform sampler2D regional_shore : filter_linear, repeat_disable;
uniform sampler2D regional_land : filter_linear, repeat_disable;
uniform vec2 origin=vec2(.235619449,.72431164);
uniform float camera_distance=500.0;
varying vec3 world_pos;
void vertex(){world_pos=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;}
vec2 geographic(vec2 p){vec2 en=vec2(p.x,-p.y);float rho=max(length(en),.000001),c=rho/6371.0088;return vec2(origin.x+atan(en.x*sin(c),rho*cos(origin.y)*cos(c)-en.y*sin(origin.y)*sin(c)),asin(cos(c)*sin(origin.y)+en.y*sin(c)*cos(origin.y)/rho))*57.295779513;}
void fragment(){
 vec2 geo=geographic(world_pos.xz),q=vec2((geo.x-6.0)/14.0,(49.0-geo.y)/14.0);
 bool region=all(greaterThanEqual(q,vec2(0.0)))&&all(lessThanEqual(q,vec2(1.0)));
 vec2 rq=(q*7168.0+.5)/7169.0;
 vec2 global_uv=vec2((geo.x+12.0)/87.0,(62.0-geo.y)/50.0);
 bool inside=all(greaterThanEqual(global_uv,vec2(0.0)))&&all(lessThanEqual(global_uv,vec2(1.0)));
 float land=region?texture(regional_ocean,rq).r:(inside?texture(shore_mask,global_uv).r:0.0);
 if(region){if(land>.5&&texture(regional_land,rq).r<.5)discard;}else{if(land>.5)discard;}
 float d=region?texture(regional_shore,rq).r*63.75:64.0;
 // Shore distance controls appearance only: it is not a bathymetric depth estimate.
 float shallow=exp(-d*.8),foam=exp(-d*8.0);
 vec2 p=world_pos.xz;
 float swell=sin(p.x*.30+p.y*.21+TIME*.22)*.5+sin(p.y*.46-p.x*.16-TIME*.14)*.5;
 float close=1.0-smoothstep(8.0,180.0,camera_distance);
 vec2 waves=vec2(sin(p.x*1.7+p.y+TIME*.36),sin(p.y*2.3-p.x*.7-TIME*.28))*.022;
 waves+=vec2(sin(p.x*74.0+p.y*51.0+TIME*.7),sin(p.y*97.0-p.x*36.0-TIME*.5))*.012*close;
 ALBEDO=mix(vec3(.013,.055,.082),vec3(.055,.205,.175),shallow*.85)*(1.0+swell*.035);
 ALBEDO=mix(ALBEDO,vec3(.34,.43,.39),foam*(.10+.05*sin(d*37.0-TIME*.65)));
 NORMAL_MAP=vec3(.5+waves.x,.5+waves.y,1.0);
 NORMAL_MAP_DEPTH=.23;ROUGHNESS=.48;SPECULAR=.20;
}
