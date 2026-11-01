shader_type spatial;
// Terrain's exaggerated, clipped coast mesh casts a false floating ledge shadow.
// Keep terrain shadows on land; the campaign sea uses sky and sun lighting only.
render_mode world_vertex_coords, cull_disabled, shadows_disabled;
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

uniform sampler2DArray fft_displacement:filter_linear,repeat_enable;
uniform sampler2DArray fft_previous_displacement:filter_linear,repeat_enable;
uniform sampler2DArray fft_normal:filter_linear_mipmap,repeat_enable;
uniform sampler2DArray fft_previous_normal:filter_linear_mipmap,repeat_enable;
uniform vec4 cascade_scales[3];
uniform int cascade_count=3;
uniform bool fft_ready=false;
uniform bool normals_resolved=true;
uniform float temporal_blend=1.;
uniform float wave_intensity=.65;
uniform float maximum_displacement_metres=.75;
uniform float shore_foam_strength=.09;
uniform vec2 patch_center=vec2(0.);
uniform float patch_radius=1.;
uniform bool patch_active=false;
uniform bool render_patch=false;
varying vec3 world_pos;
varying float wave_height;
// One continuous global phase; camera-centred geometry never owns a texture phase.
void vertex(){
 vec2 original=VERTEX.xz;
 vec3 displacement=vec3(0.);
 if(render_patch&&fft_ready){
  vec2 geo=coast_geographic(original),q=vec2((geo.x-6.)/14.,(49.-geo.y)/14.);
  vec2 rq=(q*7168.+.5)/7169.;
  bool region=all(greaterThanEqual(q,vec2(0.)))&&all(lessThanEqual(q,vec2(1.)));
  vec2 gq=(vec2((geo.x+12.)/87.,(62.-geo.y)/50.)*vec2(11136.,6400.)+.5)/vec2(11137.,6401.);
  float land=region?textureLod(regional_land,rq,0.).r:textureLod(global_land,gq,0.).r;
  float shore=region?textureLod(regional_shore,rq,0.).r*63.75*(111.195/512.):1.;
  float edge=max(abs(original.x-patch_center.x),abs(original.y-patch_center.y))/patch_radius;
  float envelope=(1.-smoothstep(.05,.45,land))*smoothstep(.015,.3,shore)*(1.-smoothstep(.72,1.,edge));
  for(int i=0;i<3;i++){if(i>=cascade_count)break;vec4 scale=cascade_scales[i];vec3 uv=vec3(original*1000.*scale.xy,float(i));displacement+=mix(textureLod(fft_previous_displacement,uv,0.).xyz,textureLod(fft_displacement,uv,0.).xyz,temporal_blend)*scale.z;}
  displacement=clamp(displacement*wave_intensity,vec3(-maximum_displacement_metres),vec3(maximum_displacement_metres))*envelope*.001;
  VERTEX+=displacement;
 }
 world_pos=VERTEX;wave_height=displacement.y*1000.;
}
void fragment(){
 // Reconstruct the flat-plane intersection for the enormous background mesh.
 // Interpolating position across its 40,000 km triangles loses close-view
 // precision and can expose the edge of the local displacement patch.
 vec4 ray_view=INV_PROJECTION_MATRIX*vec4(SCREEN_UV*2.-1.,1.,1.);
 vec3 ray_world=mat3(INV_VIEW_MATRIX)*normalize(ray_view.xyz/ray_view.w);
 vec3 sea_position=render_patch?world_pos:CAMERA_POSITION_WORLD+ray_world*(-CAMERA_POSITION_WORLD.y/min(-.000001,ray_world.y));
 if(!render_patch&&patch_active&&max(abs(sea_position.x-patch_center.x),abs(sea_position.z-patch_center.y))<=patch_radius)discard;
 vec2 geo=coast_geographic(sea_position.xz),q=vec2((geo.x-6.0)/14.0,(49.0-geo.y)/14.0);
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

 vec2 gradient=vec2(0.);float foam=0.,variance=0.;
 if(fft_ready){
  for(int i=0;i<3;i++){
   if(i>=cascade_count)break;vec4 scale=cascade_scales[i];vec3 uv=vec3(sea_position.xz*1000.*scale.xy,float(i));
   vec4 moment=texture(fft_normal,uv);
   if(!normals_resolved)moment=mix(texture(fft_previous_normal,uv),moment,temporal_blend);
   gradient+=moment.xy*scale.w;variance+=max(0.,moment.z-dot(moment.xy,moment.xy))*scale.w*scale.w;foam+=moment.w;
  }
 }
 // FFT texels are physically measured slopes, not colour-decoded normal maps.
 gradient=clamp(gradient*wave_intensity,vec2(-.7),vec2(.7));
 float coastal_damping=smoothstep(.01,.16,d);
 vec3 n=normalize(vec3(-gradient.x*coastal_damping,1.,-gradient.y*coastal_damping));
 NORMAL=normalize(mat3(VIEW_MATRIX)*n);
 float crest=smoothstep(.06,.7,foam)*foam_strength*(1.-smoothstep(20.,150.,camera_distance));
 float swash=(1.-smoothstep(.015,.08,d))*(1.-smoothstep(.15,.6,ground))*shore_foam_strength;
 swash*=.3+.7*smoothstep(-.06,.12,gradient.x+gradient.y);
 ALBEDO=mix(deep_color,coastal_color,shallow);
 ALBEDO=mix(ALBEDO,vec3(.65,.70,.66),clamp(crest+swash,0.,.35));
 // IOR 1.33 corresponds to F0 about .02 in Godot's dielectric parameterization.
 SPECULAR=.35;METALLIC=0.;
 // Filtered second moments retain unresolved wave energy as roughness rather
 // than aliased sparkles when the camera climbs or the sea becomes subpixel.
 ROUGHNESS=clamp(roughness+sqrt(variance)*.42+crest*.6,.09,.5);
 BACKLIGHT=coastal_color*.12;
}
