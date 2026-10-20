shader_type spatial;
render_mode cull_disabled, depth_draw_never;
uniform sampler2D shore_mask : filter_linear, repeat_disable;
uniform sampler2D sea_color : source_color, filter_linear_mipmap, repeat_disable;
uniform sampler2D coast_14 : filter_linear, repeat_disable;
uniform sampler2D coast_15 : filter_linear, repeat_disable;
uniform sampler2D coast_n14 : filter_linear, repeat_disable;
uniform sampler2D coast_n15 : filter_linear, repeat_disable;
uniform vec2 origin=vec2(0.235619449,0.72431164);
uniform float camera_distance=500.0;
varying vec3 world_pos;
void vertex(){world_pos=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;}
vec2 geographic(vec2 p){vec2 en=vec2(p.x,-p.y);float rho=max(length(en),.000001),c=rho/6371.0088;float lat=asin(cos(c)*sin(origin.y)+en.y*sin(c)*cos(origin.y)/rho);float lon=origin.x+atan(en.x*sin(c),rho*cos(origin.y)*cos(c)-en.y*sin(origin.y)*sin(c));return vec2(lon,lat)*57.295779513;}
float land(vec2 g){
 if(g.y>=37.0&&g.y<=38.0){if(g.x>=14.0&&g.x<15.0)return texture(coast_14,vec2(g.x-14.0,38.0-g.y)).r;if(g.x>=15.0&&g.x<=16.0)return texture(coast_15,vec2(g.x-15.0,38.0-g.y)).r;}
 if(g.y>38.0&&g.y<=39.0){if(g.x>=14.0&&g.x<15.0)return texture(coast_n14,vec2(g.x-14.0,39.0-g.y)).r;if(g.x>=15.0&&g.x<=16.0)return texture(coast_n15,vec2(g.x-15.0,39.0-g.y)).r;}
 vec2 uv=vec2((g.x+12.0)/87.0,(62.0-g.y)/50.0);if(any(lessThan(uv,vec2(0.0)))||any(greaterThan(uv,vec2(1.0))))return 0.0;return texture(shore_mask,uv).r;
}
void fragment(){
 vec2 geo=geographic(world_pos.xz);if(land(geo)>.51)discard;
 float shore=0.0;for(int i=-3;i<=3;i++){float a=float(i)*.0006;shore+=land(geo+vec2(a,0));shore+=land(geo+vec2(0,a));}shore/=14.0;
 ALBEDO=mix(vec3(.012,.055,.085),vec3(.055,.235,.22),sqrt(shore)*.85);
 float foam=smoothstep(.38,.49,shore)*(.7+.3*sin(TIME*.8+world_pos.x*18.0+world_pos.z*12.0));
 ALBEDO=mix(ALBEDO,vec3(.46,.55,.48),foam*.12);
 float a=sin(world_pos.x*2.0+world_pos.z*1.5+TIME*.35),b=sin(world_pos.z*3.0-world_pos.x*.8-TIME*.25);
 NORMAL_MAP=vec3(.5+a*.025,.5+b*.025,1.0);NORMAL_MAP_DEPTH=.08;ROUGHNESS=.3;SPECULAR=.4;
}
