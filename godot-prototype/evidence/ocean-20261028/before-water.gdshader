shader_type spatial;
// Terrain's exaggerated, clipped coast mesh casts a false floating ledge shadow.
// Keep terrain shadows on land; the campaign sea uses sky and sun lighting only.
render_mode cull_disabled, depth_draw_never, shadows_disabled;
#include "res://shoreline.gdshaderinc"
uniform sampler2D strategic_land : filter_linear, repeat_disable;
uniform sampler2D shore_mask : filter_linear, repeat_disable;
uniform sampler2D regional_ocean : filter_linear, repeat_disable;
uniform sampler2D regional_shore : filter_linear, repeat_disable;
uniform sampler2D regional_land : filter_linear, repeat_disable;
uniform sampler2D global_land : filter_linear, repeat_disable;
uniform sampler2D global_ocean : filter_linear, repeat_disable;
uniform sampler2D global_shore : filter_linear, repeat_disable;
uniform sampler2D ripple_normals : filter_linear_mipmap_anisotropic, repeat_enable;
uniform float ripple_large_km=3.5;
uniform float ripple_small_km=.42;
uniform float coastal_color_strength=.65;
uniform float camera_distance=500.0;
uniform float water_time=0.0;
uniform float animation_speed=1.0;
uniform float wave_strength=.18;
uniform float roughness=.30;
uniform float specular_strength=.42;
uniform float fresnel_strength=.16;
uniform float foam_strength=.065;
uniform float coastal_band_km=1.8;
uniform vec3 deep_color=vec3(.008,.040,.085);
uniform vec3 coastal_color=vec3(.027,.16,.16);
varying vec3 world_pos;
void vertex(){world_pos=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;}
void fragment(){
 vec2 geo=coast_geographic(world_pos.xz),q=vec2((geo.x-6.0)/14.0,(49.0-geo.y)/14.0);
 bool region=all(greaterThanEqual(q,vec2(0.0)))&&all(lessThanEqual(q,vec2(1.0)));
 vec2 rq=(q*7168.0+.5)/7169.0;
 vec2 global_uv=vec2((geo.x+12.0)/87.0,(62.0-geo.y)/50.0);
 bool inside=all(greaterThanEqual(global_uv,vec2(0.0)))&&all(lessThanEqual(global_uv,vec2(1.0)));
 vec2 gq=(global_uv*vec2(11136.0,6400.0)+.5)/vec2(11137.0,6401.0);
 float land=region?texture(regional_ocean,rq).r:(inside?texture(global_ocean,gq).r:0.0);
 if(camera_distance>2800.0)land=mix(land,inside?texture(shore_mask,global_uv).r:0.0,smoothstep(2800.0,4000.0,camera_distance));
 float ground=region?coast_coverage(regional_land,rq):(inside?coast_coverage(global_land,gq):0.0);
 float source_ground=region?texture(regional_land,rq).r:(inside?texture(global_land,gq).r:0.0);
 if(camera_distance>2800.0){
  float distant_ground=inside?texture(strategic_land,global_uv).r:0.0;
  float blend=smoothstep(2800.0,4000.0,camera_distance);
  ground=mix(ground,distant_ground,blend);
  source_ground=mix(source_ground,distant_ground,blend);
 }
 // Keep sea under opaque land: elevated coast edges otherwise reveal the
 // background through parallax gaps. Inland water exclusions remain intact.
 // Compare unfiltered source masks for lakes: smoothing must not misclassify
 // an ordinary sea coast as inland water and expose background slivers.
 if(land>.5&&source_ground<.5)discard;
 vec2 sq=(global_uv*vec2(2784.0,1600.0)+.5)/vec2(2785.0,1601.0);
 // Regional distance stores source pixels; global distance already stores km.
 float d=region?texture(regional_shore,rq).r*63.75*(111.195/512.0):(inside?texture(global_shore,sq).r*63.75:64.0);
 // Shore distance controls appearance only: it is not a bathymetric depth estimate.
 float shallow=exp(-d/max(.1,coastal_band_km));
 vec2 p=world_pos.xz;
 float t=water_time*animation_speed;
 // Independently advected spectra; mip filtering removes subpixel sparkle.
 // The source texture is independently synthesized, not a game asset.
 vec2 large_uv=p/ripple_large_km+vec2(.0007,-.0004)*t;
 vec2 small_uv=mat2(vec2(.8,.6),vec2(-.6,.8))*p/ripple_small_km+vec2(-.0013,.0009)*t;
 vec2 waves=(texture(ripple_normals,large_uv).rg*2.0-1.0)*.65;
 waves+=(texture(ripple_normals,small_uv).rg*2.0-1.0)*.35;
 waves*=1.0-smoothstep(250.0,1500.0,camera_distance)*.75;
 vec3 normal_world=normalize(vec3(-waves.x*wave_strength,1.0,-waves.y*wave_strength));
 NORMAL=normalize(mat3(VIEW_MATRIX)*normal_world);
 float fresnel=pow(1.0-clamp(dot(NORMAL,VIEW),0.0,1.0),5.0);
 ALBEDO=mix(deep_color,coastal_color,shallow*coastal_color_strength);
 ALBEDO=mix(ALBEDO,vec3(.24,.34,.38),fresnel*fresnel_strength);
 // Restrained shore-distance wash, close views only. Never changes alpha/masks.
 // Source-mask fringe supplies a narrow, broken wash, not a broad white halo.
 float edge=smoothstep(.36,.46,ground)*(1.0-smoothstep(.49,.51,ground));
 float foam=edge*(1.0-smoothstep(100.0,650.0,camera_distance));
 float wash=smoothstep(.77,.96,texture(ripple_normals,p/.25+vec2(.001,-.0008)*t).b);
 ALBEDO=mix(ALBEDO,vec3(.36,.42,.36),foam*wash*foam_strength);
 // Broken, mip-filtered gloss rather than a broad uniform specular sheet.
 float gloss=texture(ripple_normals,small_uv).b;
 ROUGHNESS=mix(roughness,roughness+.12,gloss);
 ROUGHNESS=mix(ROUGHNESS,min(.55,roughness+.15),smoothstep(150.0,1600.0,camera_distance));
 SPECULAR=specular_strength;
 METALLIC=.04;
}
