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
uniform sampler2D global_land : filter_linear, repeat_disable;
uniform sampler2D strategic_land : filter_linear, repeat_disable;
uniform sampler2D global_ecology : filter_linear, repeat_disable;
uniform sampler2D quality_rock : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D quality_ground : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D quality_canopy : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform vec4 tile_bounds=vec4(-12.0,12.0,75.0,62.0);
uniform vec4 children[12];
uniform int child_count=0;
uniform float reveal=1.0;
uniform float detail_strength=1.0;
uniform float camera_distance=1000.0;
uniform vec4 neighbors=vec4(1.0);
uniform bool clip_region=false;
uniform int debug_view=0;
varying vec3 world_pos;
varying vec3 ground_normal;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
vec2 local_uv(vec2 geo){return vec2((geo.x-tile_bounds.x)/(tile_bounds.z-tile_bounds.x),(tile_bounds.w-geo.y)/(tile_bounds.w-tile_bounds.y));}
vec3 surface_sample(sampler2D tex,vec2 p){vec2 r=mat2(vec2(.8,.6),vec2(-.6,.8))*p*.371+vec2(.31,.77);return mix(texture(tex,p).rgb,texture(tex,r).rgb,.43);}
vec3 rock_surface(vec3 p,vec3 n){vec3 w=pow(abs(n),vec3(4.0));w/=max(dot(w,vec3(1.0)),.001);return texture(quality_rock,p.yz).rgb*w.x+texture(quality_rock,p.xz).rgb*w.y+texture(quality_rock,p.xy).rgb*w.z;}
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
 vec2 global_q=(UV*vec2(11136.0,6400.0)+.5)/vec2(11137.0,6401.0);
 float land=in_region?texture(regional_land,rq).r:texture(global_land,global_q).r;
 if(camera_distance>2800.0)land=mix(land,texture(strategic_land,UV).r,smoothstep(2800.0,4000.0,camera_distance));
 if(land<.5)discard;
 for(int i=0;i<12;i++){if(i>=child_count)break;vec4 b=children[i];if(UV.x>b.x+.000001&&UV.y>b.y+.000001&&UV.x<b.z-.000001&&UV.y<b.w-.000001)discard;}
 vec3 macro=texture(macro_color,(UV*vec2(3915.0,2250.0)+.5)/vec2(3916.0,2251.0)).rgb;
 vec3 eco=texture(ecology,(region*448.0+.5)/449.0).rgb;
 vec4 global_eco=texture(global_ecology,(UV*vec2(1392.0,800.0)+.5)/vec2(1393.0,801.0));
 float region_edge=min(min(geo.x-6.0,20.0-geo.x),min(geo.y-35.8,49.0-geo.y));
 float italian_style=in_region?smoothstep(0.0,.6,region_edge):0.0;
 eco=mix(global_eco.rgb,eco,italian_style);
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
 vec2 warp=vec2(noise(p*.07),noise(p*.07+19.2))*.7;
 vec3 mineral=rock_surface(world_pos*.21+vec3(warp.x,0,warp.y),ground_normal);
 vec3 grain=surface_sample(quality_ground,p*.53+warp);
 vec3 near_grain=surface_sample(quality_ground,p*18.0);
 float nearby=1.0-smoothstep(8.0,75.0,camera_distance);
 grain=mix(grain,near_grain,nearby*.55);
 vec3 ground_tint=mix(vec3(.57,.89,.60),vec3(.94,.91,.72),eco.b);
 vec3 textured_ground=grain*ground_tint;
 // Distant canopy is a continuous irregular cover, not repeated alpha-card squares.
 float canopy=noise(p*7.0+warp)*.6+noise(p*19.0)*.4;
 vec3 canopy_colour=woods*(.82+canopy*.32+middle*.18);
 vec3 landscape=mix(textured_ground*.84,canopy_colour,forest*.91);
 float rock_weight=max(steep,alpine*.91);
 landscape=mix(landscape,mineral*.75,rock_weight);
 landscape=mix(landscape,mineral*vec3(.23,.24,.23),etna);
 landscape=mix(landscape,vec3(.60,.60,.55),snow*.80);
 landscape=mix(landscape,grain*vec3(1.25,1.20,1.04),coast_weight*.65);
 regional=mix(regional*.46,landscape,.88);
 if(italian_style<1.0){
  float arid=max(eco.b,(1.0-smoothstep(29.0,38.0,geo.y))*(1.0-eco.g)*.85);
  vec3 tint=mix(vec3(.53,.83,.57),vec3(1.10,.94,.73),arid);
  vec3 dry_ground=mix(grain, mineral,.18+steep*.55)*vec3(1.12,.99,.80);
  vec3 world_ground=mix(grain*tint,dry_ground,smoothstep(.4,.95,arid));
  float cover=forest*(1.0-arid*.86);
  vec3 world_woods=mix(vec3(.025,.068,.047),vec3(.065,.092,.041),arid);
  vec3 world_surface=mix(world_ground*.84,world_woods*(.82+canopy*.32+middle*.18),cover*.91);
  world_surface=mix(world_surface,mineral*mix(vec3(.64,.68,.67),vec3(.87,.76,.61),arid),rock_weight);
  // Floodplain colour follows existing river centrelines; no invented river geometry.
  float riparian=smoothstep(.10,.75,global_eco.a)*(1.0-smoothstep(.10,.30,slope));
  world_surface=mix(world_surface,vec3(.60,.60,.55),snow*.8);
  world_surface=mix(world_surface,grain*vec3(1.25,1.20,1.04),coast_weight*.45);
  // Apply this after the low-elevation shore tint: a fertile inland valley is not a beach.
  float source_fertility=smoothstep(.70,.95,global_eco.g)*(1.0-smoothstep(.08,.20,slope))*.70;
  world_surface=mix(world_surface,grain*vec3(.24,.64,.21),max(riparian,source_fertility)*.86);
  // Preserve source geographic colour cues without reverting to the flat overview texture.
  regional=mix(mix(world_surface,macro*.46,.12),regional,italian_style);
 }
 float region_weight=detail_strength;
 ALBEDO=mix(macro*.57,regional,region_weight);
 ROUGHNESS=.94;SPECULAR=.12;
 vec2 nq=p*(1.2+nearby*9.0);
 float dx=dot(texture(quality_rock,nq+vec2(.001,0)).rgb-texture(quality_rock,nq-vec2(.001,0)).rgb,vec3(.333));
 float dy=dot(texture(quality_rock,nq+vec2(0,.001)).rgb-texture(quality_rock,nq-vec2(0,.001)).rgb,vec3(.333));
 NORMAL_MAP=normalize(vec3(-dx*2.5,-dy*2.5,1.0))*.5+.5;
 NORMAL_MAP_DEPTH=mix(.05,.40,rock_weight)*detail_strength;
 if(debug_view==1){ALBEDO=vec3(0.0);EMISSION=vec3(eco.r,region_weight,steep);}
 if(debug_view==2){ALBEDO=vec3(0.0);EMISSION=vec3(global_eco.a,global_eco.b,global_eco.g);}
}
