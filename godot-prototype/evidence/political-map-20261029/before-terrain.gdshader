shader_type spatial;
render_mode cull_disabled;
#include "res://shoreline.gdshaderinc"
#include "res://habitat.gdshaderinc"
#include "res://environment.gdshaderinc"
#include "res://north_africa.gdshaderinc"
#include "res://landscape_surface.gdshaderinc"
uniform vec3 na_alluvium_tint=vec3(.55,1.15,.40);
uniform vec3 na_sand_color=vec3(.43,.32,.20);
uniform float na_rock_strength=.65;
uniform float na_relief_contrast=2.6;
uniform sampler2D foundation_ground:source_color,filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D foundation_normal:hint_normal,filter_linear_mipmap_anisotropic,repeat_enable;
uniform float foundation_photo_tile_km=.09;
uniform float foundation_detail_near_km=6.0;
uniform float foundation_detail_far_km=55.0;
uniform float foundation_photo_strength=.55;
uniform float foundation_normal_strength=.3;
uniform sampler2D roma_landscape_mask:filter_linear_mipmap,repeat_disable;
uniform vec4 roma_landscape_rect=vec4(0.0);
// Explicit opt-in Roma showcase replaces only its constructed local ground.
uniform vec3 roma_showcase_ground=vec3(0.0);
uniform vec3 minor_identity_ground=vec3(0.0);
uniform sampler2D coast : filter_linear, repeat_disable;
uniform sampler2D macro_color : source_color, filter_linear_mipmap_anisotropic, repeat_disable;
uniform sampler2D regional_land : filter_linear, repeat_disable;
uniform sampler2D ecology : filter_linear, repeat_disable;
uniform sampler2D global_land : filter_linear, repeat_disable;
uniform sampler2D strategic_land : filter_linear, repeat_disable;
uniform sampler2D global_ecology : filter_linear, repeat_disable;
uniform sampler2D quality_rock : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D quality_ground : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D quality_mosaic : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D quality_temperate : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D quality_arid : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D quality_alluvium : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D river_corridors : filter_linear, repeat_disable;
uniform vec4 geology_fields[8];
uniform float geology_full_elevation[8];
uniform int geology_count=0;
uniform vec4 tile_bounds=vec4(-12.0,12.0,75.0,62.0);
uniform vec4 children[12];
uniform int child_count=0;
uniform float reveal=1.0;
uniform float detail_strength=1.0;
uniform float camera_distance=1000.0;
uniform sampler2D strategic_relief : filter_linear_mipmap, repeat_disable;
uniform float relief_start_km=120.0;
uniform float relief_full_km=500.0;
uniform float relief_contrast=2.4;
uniform float relief_strength=.85;
uniform vec3 relief_light_direction=vec3(.5,.5,.5);
uniform float coverage_overlap_km=.6;
uniform float shore_blend_strength=.65;
uniform float ground_tile_km=.012;
uniform float rock_tile_km=.035;
uniform float habitat_strength=.85;
uniform float mosaic_strength=.75;
uniform float mosaic_tile_km=1.5;
uniform float ground_macro_strength=.22;
uniform float canopy_relief=.65;
uniform float rock_strata_strength=.28;
uniform float rock_strata_scale=90.0;
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
vec3 dry_rock_surface(vec3 p,vec3 n){vec3 w=pow(abs(n),vec3(4.0));w/=max(dot(w,vec3(1.0)),.001);return texture(quality_arid,p.yz).rgb*w.x+texture(quality_arid,p.xz).rgb*w.y+texture(quality_arid,p.xy).rgb*w.z;}
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
 if(roma_showcase_ground.z>0.0&&camera_distance<15.0&&distance(world_pos.xz,roma_showcase_ground.xy)<roma_showcase_ground.z)discard;
 if(minor_identity_ground.z>0.0&&camera_distance<15.0&&distance(world_pos.xz,minor_identity_ground.xy)<minor_identity_ground.z)discard;
 vec2 geo=vec2(UV.x*87.0-12.0,62.0-UV.y*50.0),region=vec2((geo.x-6.0)/14.0,(49.0-geo.y)/14.0);
 bool in_region=all(greaterThanEqual(region,vec2(0.0)))&&all(lessThanEqual(region,vec2(1.0)));
 // Keep a narrow parent strip under differently tessellated projected edges.
 // Sampling and source vertices stay unchanged; only parent fragment clipping moves.
 vec2 geo_overlap=vec2(coverage_overlap_km/(111.195*max(.3,cos(radians(geo.y)))),coverage_overlap_km/111.195);
 vec2 region_overlap=geo_overlap/14.0;
 if(clip_region&&all(greaterThan(region,region_overlap))&&all(lessThan(region,vec2(1.0)-region_overlap)))discard;
 vec2 coast_geo=coast_geographic(world_pos.xz);
 vec2 coast_region=vec2((coast_geo.x-6.0)/14.0,(49.0-coast_geo.y)/14.0);
 bool coast_local=all(greaterThanEqual(coast_region,vec2(0.0)))&&all(lessThanEqual(coast_region,vec2(1.0)));
 vec2 coast_uv=vec2((coast_geo.x+12.0)/87.0,(62.0-coast_geo.y)/50.0);
 vec2 rq=(coast_region*7168.0+.5)/7169.0;
 vec2 global_q=(coast_uv*vec2(11136.0,6400.0)+.5)/vec2(11137.0,6401.0);
 float land=coast_local?coast_coverage(regional_land,rq):coast_coverage(global_land,global_q);
 if(camera_distance>2800.0)land=mix(land,texture(strategic_land,coast_uv).r,smoothstep(2800.0,4000.0,camera_distance));
 if(land<.5)discard;
 vec2 cover_inset=geo_overlap/vec2(87.0,50.0);
 for(int i=0;i<12;i++){if(i>=child_count)break;vec4 b=children[i];if(UV.x>b.x+cover_inset.x&&UV.y>b.y+cover_inset.y&&UV.x<b.z-cover_inset.x&&UV.y<b.w-cover_inset.y)discard;}
 float landscape_weight=landscape_scope(world_pos.xz);
 NORMAL_MAP=vec3(.5,.5,1.);NORMAL_MAP_DEPTH=0.;
 if(landscape_weight>.999){
  vec3 c,n;float r;landscape_surface(world_pos,normalize(ground_normal),c,n,r);
  ALBEDO=c;NORMAL=normalize(mat3(VIEW_MATRIX)*n);ROUGHNESS=r;SPECULAR=.28;
 }else{
 vec3 macro=texture(macro_color,(UV*vec2(3915.0,2250.0)+.5)/vec2(3916.0,2251.0)).rgb;
 vec4 global_eco=texture(global_ecology,(UV*vec2(1392.0,800.0)+.5)/vec2(1393.0,801.0));
 vec2 river_size=vec2(textureSize(river_corridors,0));
 global_eco.a=texture(river_corridors,(UV*(river_size-1.0)+.5)/river_size).r;
 vec3 eco=global_eco.rgb;
 vec4 family=environment_weights(geo.y,global_eco);
 // The same geographic lighting field spans context and resident detail meshes.
 // Source-derived normals reveal ridges without displacing terrain or anchors.
 vec2 relief_size=vec2(textureSize(strategic_relief,0));
 vec2 relief_uv=(UV*(relief_size-1.0)+.5)/relief_size;
 vec3 relief_normal=normalize(texture(strategic_relief,relief_uv).rgb*2.0-1.0);
 float strategic=smoothstep(relief_start_km,relief_full_km,camera_distance);
 vec3 lighting_normal=normalize(mix(ground_normal,relief_normal,strategic*relief_strength));
 NORMAL=normalize(mat3(VIEW_MATRIX)*lighting_normal);
 float slope=1.0-clamp(lighting_normal.y,0.0,1.0),h=world_pos.y/1.5;
 float africa=na_scope(geo);
 float fertile=africa*na_plain(global_eco,h,slope);
 family=mix(family,vec4(0,0,0,1),fertile);
 vec2 p=world_pos.xz;
 float wide=noise(p*.035),middle=noise(p*.24);
 float steep=smoothstep(.045,.30,slope),alpine=smoothstep(1.55,2.55,h);
 float snow=smoothstep(2.8,3.65,h+wide*.30)*(1.0-smoothstep(.24,.56,slope));
 float volcanic=0.0;
 for(int i=0;i<8;i++){
  if(i>=geology_count)break;
  vec4 field=geology_fields[i];
  float radius=length((geo-field.xy)*vec2(cos(radians(field.y)),1.0));
  volcanic=max(volcanic,(1.0-smoothstep(field.z*.23,field.z,radius))*smoothstep(field.w,geology_full_elevation[i],h));
 }
 float coast_weight=1.0-smoothstep(.002,.045,h);
 if(africa>0.0){
  // Ocean distance is zero inland; use the actual land-coverage fringe.
  coast_weight*=mix(1.0,1.0-smoothstep(.5,.98,land),africa);
 }
 float forest=smoothstep(.25,.65,habitat_cover(p,eco.g,eco.b,h))*(1.0-smoothstep(.15,.38,slope))*dot(family,environment_cover);
 vec2 warp=vec2(noise(p*.07),noise(p*.07+19.2))*.7;
 vec3 mineral=rock_surface(world_pos/rock_tile_km,ground_normal);
 mineral=mix(mineral,rock_surface(world_pos*.85,ground_normal),.48);
 if(family.z>.005)mineral=mix(mineral,dry_rock_surface(world_pos/rock_tile_km,ground_normal),family.z*.85);
 vec3 grain=surface_sample(quality_ground,p/ground_tile_km);
 // A meso layer survives strategic sampling; metre-scale detail alone averages
 // to a flat colour before the camera reaches normal campaign height.
 grain=mix(grain,surface_sample(quality_ground,p*7.0),ground_macro_strength);
 vec3 near_grain=surface_sample(quality_ground,p/(ground_tile_km*.35));
 float nearby=1.0-smoothstep(8.0,75.0,camera_distance);
 grain=mix(grain,near_grain,nearby*.55);
 vec3 ground_tint=mix(vec3(.76,1.12,.68),vec3(1.13,1.04,.82),eco.b*.65);
 vec3 med_ground=grain*ground_tint;
 vec3 temperate=vec3(0.0),dry_ground=vec3(0.0),alluvium=vec3(0.0);
 vec3 meso_temperate=vec3(0.0),meso_dry=vec3(0.0),meso_alluvium=vec3(0.0);
 if(family.y>.005){
  meso_temperate=surface_sample(quality_temperate,p*5.5);
  temperate=mix(surface_sample(quality_temperate,p/ground_tile_km),meso_temperate,ground_macro_strength);
 }
 if(family.z>.005){
  meso_dry=surface_sample(quality_arid,p*3.5);
  dry_ground=mix(surface_sample(quality_arid,p/ground_tile_km),meso_dry,ground_macro_strength);
 }
 if(family.w>.005){
  meso_alluvium=surface_sample(quality_alluvium,p*6.0);
  alluvium=mix(surface_sample(quality_alluvium,p/ground_tile_km),meso_alluvium,ground_macro_strength);
 }
 vec3 textured_ground=med_ground*family.x+temperate*family.y+dry_ground*family.z+alluvium*family.w;
 grain=textured_ground;
 // Distant canopy is a continuous irregular cover, not repeated alpha-card squares.
 float canopy=habitat_noise(p*7.0+warp)*.6+habitat_noise(p*19.0)*.4;
 // An opaque canopy shading layer joins the finite grove instances into a
 // readable woodland mass at campaign height. This changes normals, not heights.
 vec2 cp=p*7.0+warp;
 vec2 canopy_gradient=vec2(habitat_noise(cp+vec2(.15,0))-habitat_noise(cp-vec2(.15,0)),habitat_noise(cp+vec2(0,.15))-habitat_noise(cp-vec2(0,.15)));
 vec3 surface_normal=normalize(lighting_normal+vec3(-canopy_gradient.x,0,-canopy_gradient.y)*forest*canopy_relief);
 NORMAL=normalize(mat3(VIEW_MATRIX)*surface_normal);
 vec3 canopy_colour=(vec3(.045,.085,.030)*family.x+vec3(.028,.065,.038)*family.y+vec3(.12,.13,.055)*family.z+vec3(.04,.11,.045)*family.w)*(.76+canopy*.6);
 vec3 landscape=mix(textured_ground*.86,canopy_colour*(.65+canopy*.7),forest*habitat_strength);
 landscape*=.65+habitat_noise(p*.8)*.50+middle*.15;
 float rock_weight=max(steep,alpine*.91);
 // Layered exposed mineral follows existing elevation/slope, adding no ridges
 // or cliffs to the geographical mesh. The shared world-space phase has no seams.
 float strata=.5+.5*sin(h*rock_strata_scale+noise(p*.9)*2.0);
 mineral*=mix(1.0,.78+strata*.36,rock_strata_strength);
 landscape=mix(landscape,mineral*.61,rock_weight);
 landscape=mix(landscape,mineral*vec3(.23,.24,.23),volcanic);
 landscape=mix(landscape,vec3(.60,.60,.55),snow*.80);
 landscape=mix(landscape,grain*vec3(1.12,1.05,.87),coast_weight*.48);
 vec3 regional=landscape;
 float region_weight=detail_strength;
 vec3 mosaic=surface_sample(quality_mosaic,p/mosaic_tile_km+warp*.15);
 float mosaic_weight=mosaic_strength*(1.0-max(rock_weight,snow))*(1.0-volcanic);
 // Regional material structure survives mip sampling; fine ground remains
 // available close up. It supplies no coast, road, height or river geometry.
 vec3 family_meso=mosaic*family.x+meso_temperate*family.y+meso_dry*family.z+meso_alluvium*family.w;
 vec3 mosaic_detail=clamp(family_meso/vec3(.15,.15,.10),vec3(.55),vec3(1.65));
 vec3 detailed_surface=regional*mix(vec3(1.0),mosaic_detail,mosaic_weight);
 regional=mix(detailed_surface,mix(regional,family_meso*.85,.25),nearby*.30);
 ALBEDO=mix(macro*.57,regional,region_weight);
 if(africa>0.0){
  // Source height/aspect distinguish plateaux and exposed hill slopes from sand.
  // No vertex displacement or invented erosion/drainage geometry is introduced.
  float dry=africa*(1.0-fertile)*smoothstep(.28,.65,eco.b);
  vec3 sand_grain=mix(surface_sample(quality_arid,p/ground_tile_km),surface_sample(quality_arid,p*8.0),.55);
  vec3 sand=na_sand_color*(.68+dot(sand_grain,vec3(.333))*1.65);
  float exposure=clamp(smoothstep(.004,.09,slope)*.75+smoothstep(.18,.9,h)*.25,0.0,1.0);
  vec3 desert=mix(sand,mineral*vec3(.77,.73,.65),exposure*na_rock_strength);
  ALBEDO=mix(ALBEDO,desert,dry*detail_strength);
  vec3 moist_grain=mix(surface_sample(quality_alluvium,p/ground_tile_km),surface_sample(quality_alluvium,p*8.0),.62);
  float silt=habitat_noise(p*.9+vec2(7.0,3.0));
  vec3 moist=moist_grain*mix(na_alluvium_tint,vec3(.76,.73,.48),silt*.22);
  moist*=.72+habitat_noise(p*.55)*.34;
  moist*=1.0-global_eco.a*.13;
  ALBEDO=mix(ALBEDO,moist,fertile*.88*detail_strength);
  vec3 source_light=normalize(relief_light_direction);
  float aspect=dot(relief_normal,source_light)-source_light.y;
  ALBEDO*=mix(1.0,clamp(exp(aspect*na_relief_contrast),.60,1.35),dry);
 }
 float foundation_detail=1.0-smoothstep(foundation_detail_near_km,foundation_detail_far_km,camera_distance);
 if(foundation_detail>0.0){
  vec3 photograph=surface_sample(foundation_ground,p/foundation_photo_tile_km);
  vec3 structure=clamp(photograph/vec3(.15,.16,.09),vec3(.55),vec3(1.65));
  ALBEDO*=mix(vec3(1.0),structure,foundation_detail*foundation_photo_strength);
 }
 // A continuous mineral/wet fringe instead of a hard grass-to-sea cutout.
 // Height and slope restrict pale sediment to low gentle coasts, not cliffs.
 float shore_edge=1.0-smoothstep(.5,.98,land);
 float beach=(1.0-smoothstep(.025,.12,h))*(1.0-smoothstep(.06,.20,slope));
 vec3 shore_ground=mix(grain*vec3(.48,.49,.43),grain*vec3(.83,.79,.61),beach);
 ALBEDO=mix(ALBEDO,shore_ground,shore_edge*shore_blend_strength);
 ALBEDO*=1.0-shore_edge*.18;
 vec3 light_direction=normalize(relief_light_direction);
 float relief=dot(relief_normal,light_direction)-light_direction.y;
 ALBEDO*=clamp(exp(relief*relief_contrast*strategic),.65,1.3);
 // Local art mask changes only surface response; geometry uses existing DEM inputs.
 if(roma_landscape_rect.z>0.0){
  vec2 city_uv=(world_pos.xz-roma_landscape_rect.xy)/roma_landscape_rect.zw;
  if(all(greaterThanEqual(city_uv,vec2(0.0)))&&all(lessThanEqual(city_uv,vec2(1.0)))){
   vec4 paint=texture(roma_landscape_mask,city_uv);
   float photograph=texture(foundation_ground,world_pos.xz/.009).r;
   vec3 crop=mix(ALBEDO*vec3(.58,.83,.38),vec3(.21,.24,.10),.18);
   vec3 tilled=mix(ALBEDO,vec3(.25,.19,.115),.65);
   vec3 worn=mix(vec3(.19,.145,.085),vec3(.32,.255,.155),photograph);
   ALBEDO=mix(ALBEDO,crop,paint.r);
   ALBEDO=mix(ALBEDO,tilled,paint.g);
   ALBEDO=mix(ALBEDO,worn,clamp(paint.b*.85+paint.a*.6,0.,1.));
   float furrow=world_pos.x*2100.;
   ALBEDO*=1.+(paint.r+paint.g)*.045*sin(furrow)*exp(-fwidth(furrow)*2.);
  }
 }
 ROUGHNESS=.94;SPECULAR=.12;
 // Do not pay for four close-detail samples after their strength reaches zero.
 NORMAL_MAP=vec3(.5,.5,1.0);NORMAL_MAP_DEPTH=0.0;
 if(strategic<1.0){
  vec2 nq=p/rock_tile_km;
  float dx=dot(texture(quality_rock,nq+vec2(.001,0)).rgb-texture(quality_rock,nq-vec2(.001,0)).rgb,vec3(.333));
  float dy=dot(texture(quality_rock,nq+vec2(0,.001)).rgb-texture(quality_rock,nq-vec2(0,.001)).rgb,vec3(.333));
  NORMAL_MAP=normalize(vec3(-dx*2.5,-dy*2.5,1.0))*.5+.5;
  NORMAL_MAP_DEPTH=mix(.05,.40,rock_weight)*detail_strength*(1.0-strategic);
 }
 if(foundation_detail>0.0){
  NORMAL_MAP=mix(NORMAL_MAP,texture(foundation_normal,p/foundation_photo_tile_km).rgb,foundation_detail);
  NORMAL_MAP_DEPTH=max(NORMAL_MAP_DEPTH,foundation_detail*foundation_normal_strength);
 }
 if(landscape_weight>0.){vec3 c,n;float r;landscape_surface(world_pos,normalize(ground_normal),c,n,r);ALBEDO=mix(ALBEDO,c,landscape_weight);NORMAL=normalize(mix(NORMAL,mat3(VIEW_MATRIX)*n,landscape_weight));ROUGHNESS=mix(ROUGHNESS,r,landscape_weight);NORMAL_MAP_DEPTH*=1.-landscape_weight;}
 if(debug_view==1){ALBEDO=vec3(0.0);EMISSION=vec3(eco.r,region_weight,steep);}
 if(debug_view==2){ALBEDO=vec3(0.0);EMISSION=vec3(global_eco.a,global_eco.b,global_eco.g);}
 }
}
