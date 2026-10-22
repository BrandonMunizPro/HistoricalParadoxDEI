shader_type spatial;
render_mode cull_disabled;
uniform sampler2D coast : filter_linear, repeat_disable;
uniform sampler2D macro_color : source_color, filter_linear_mipmap_anisotropic, repeat_disable;
uniform sampler2D rock : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D grass : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D soil : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D lava : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D sand : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D rock_normal : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D grass_normal : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D lava_normal : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D regional_land : filter_linear, repeat_disable;
uniform sampler2D ecology : filter_linear, repeat_disable;
uniform vec4 tile_bounds=vec4(-12.0,12.0,75.0,62.0);
uniform vec4 children[12];
uniform int child_count=0;
uniform float reveal=1.0;
uniform float detail_strength=1.0;
uniform vec4 neighbors=vec4(1.0);
uniform bool clip_region=false;
uniform int debug_view=0;
varying vec3 world_pos;
varying vec3 ground_normal;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
vec2 local_uv(vec2 geo){return vec2((geo.x-tile_bounds.x)/(tile_bounds.z-tile_bounds.x),(tile_bounds.w-geo.y)/(tile_bounds.w-tile_bounds.y));}
void vertex(){
 vec2 geo=vec2(UV.x*87.0-12.0,62.0-UV.y*50.0),q=local_uv(geo);
 float edge=1.0;
 if(neighbors.x<.5)edge=min(edge,q.x/.055);
 if(neighbors.y<.5)edge=min(edge,(1.0-q.x)/.055);
 if(neighbors.z<.5)edge=min(edge,q.y/.055);
 if(neighbors.w<.5)edge=min(edge,(1.0-q.y)/.055);
 float blend=clamp(edge,0.0,1.0)*reveal;
 VERTEX.y=mix(UV2.x,VERTEX.y,blend);
 NORMAL=normalize(mix(COLOR.rgb*2.0-1.0,NORMAL,blend));
 world_pos=VERTEX;ground_normal=NORMAL;
}
void fragment(){
 vec2 geo=vec2(UV.x*87.0-12.0,62.0-UV.y*50.0),region=vec2((geo.x-6.0)/14.0,(49.0-geo.y)/14.0);
 bool in_region=all(greaterThanEqual(region,vec2(0.0)))&&all(lessThanEqual(region,vec2(1.0)));
 if(clip_region&&all(greaterThan(region,vec2(.0001)))&&all(lessThan(region,vec2(.9999))))discard;
 vec2 rq=(region*7168.0+.5)/7169.0;
 float land=in_region?texture(regional_land,rq).r:texture(coast,local_uv(geo)).r;
 if(land<.5)discard;
 for(int i=0;i<12;i++){if(i>=child_count)break;vec4 b=children[i];if(UV.x>b.x+.000001&&UV.y>b.y+.000001&&UV.x<b.z-.000001&&UV.y<b.w-.000001)discard;}
 vec3 macro=texture(macro_color,(UV*vec2(3915.0,2250.0)+.5)/vec2(3916.0,2251.0)).rgb;
 vec3 eco=texture(ecology,(region*448.0+.5)/449.0).rgb;
 float slope=1.0-clamp(ground_normal.y,0.0,1.0),h=world_pos.y/1.5;
 vec2 p=world_pos.xz;
 float wide=noise(p*.035),middle=noise(p*.24),fine=noise(p*1.7);
 float steep=smoothstep(.045,.30,slope),alpine=smoothstep(1.55,2.55,h);
 float snow=smoothstep(2.8,3.65,h+wide*.30)*(1.0-smoothstep(.24,.56,slope));
 float etna=(1.0-smoothstep(.10,.43,length((geo-vec2(15.0,37.75))*vec2(.79,1.0))))*smoothstep(.55,1.9,h);
 float coast_weight=1.0-smoothstep(.002,.045,h),forest=smoothstep(.12,.65,eco.r);
 vec3 lowland=mix(vec3(.10,.18,.065),vec3(.25,.22,.10),eco.b*.6+middle*.2);
 vec3 meadow=mix(lowland,vec3(.18,.24,.13),alpine);
 vec3 woods=mix(vec3(.025,.070,.048),vec3(.065,.105,.045),eco.b);
 vec3 regional=mix(meadow,woods,forest*.93);
 vec3 limestone=mix(vec3(.31,.32,.29),vec3(.48,.46,.38),wide);
 regional=mix(regional,limestone,max(steep,alpine*.78));
 regional=mix(regional,vec3(.085,.087,.079)*(0.88+middle*.27),etna);
 regional=mix(regional,vec3(.65,.62,.51),snow*.8);
 regional=mix(regional,vec3(.40,.37,.24),coast_weight*.6);
 vec2 uv=p*.65,rot=mat2(vec2(.8,.6),vec2(-.6,.8))*p*.173;
 vec3 micro=mix(texture(grass,uv).rgb,texture(soil,rot).rgb,.35);
 micro=mix(micro,texture(rock,uv*.61+wide*.25).rgb,steep);
 float micro_luma=dot(micro,vec3(.3,.5,.2));
 regional*=mix(.88,1.13,clamp(micro_luma*2.3,0.0,1.0))*(.92+fine*.08);
 float region_weight=in_region?detail_strength:0.0;
 ALBEDO=mix(macro*.57,regional*.46,region_weight);
 ROUGHNESS=.94;SPECULAR=.12;
 NORMAL_MAP=mix(texture(grass_normal,uv).rgb,texture(rock_normal,uv*.61).rgb,steep);
 NORMAL_MAP_DEPTH=.12*detail_strength;
 if(debug_view==1){ALBEDO=vec3(0.0);EMISSION=vec3(eco.r,region_weight,steep);}
}
