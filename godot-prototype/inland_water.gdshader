shader_type spatial;
// Original lake levels and river ribbons remain authoritative. Waves affect
// lighting only: moving their coarse polygon vertices would move the banks.
render_mode cull_disabled, shadows_disabled;
#include "res://political_map.gdshaderinc"
uniform sampler2DArray fft_normal:filter_linear_mipmap,repeat_enable;
uniform sampler2DArray fft_previous_normal:filter_linear_mipmap,repeat_enable;
uniform sampler2D ripple_normals:filter_linear_mipmap_anisotropic,repeat_enable;
uniform vec4 cascade_scales[3];
uniform int cascade_count=3;
uniform bool fft_ready=false;
uniform bool normals_resolved=true;
uniform float temporal_blend=1.;
uniform float wave_intensity=.65;
uniform float inland_calmness=.8;
uniform float camera_distance=1.;
uniform float water_time=0.;
uniform vec2 wind_direction=vec2(.88295,.46947);
uniform float strategic_begin_km=4.;
uniform float strategic_full_km=24.;
uniform float strategic_drift_km_s=.009;
uniform float strategic_normal_strength=.06;
uniform float strategic_roughness_strength=.10;
uniform float strategic_color_strength=.22;
uniform float strategic_strength=1.;
uniform float river_roughness=.14;
uniform float river_specular=.35;
uniform float bank_fraction=.10;
uniform vec3 deep_color=vec3(.012,.065,.115);
uniform vec3 coastal_color=vec3(.045,.23,.235);
varying vec3 world_pos;
void vertex(){world_pos=(MODEL_MATRIX*vec4(VERTEX,1.)).xyz;}
void fragment(){
 float bank=1.-smoothstep(0.,bank_fraction,min(UV.x,1.-UV.x));
 if(political_blend<1.){
  vec2 gradient=vec2(0.);float variance=0.;
  if(fft_ready){
   for(int i=0;i<3;i++){
    if(i>=cascade_count)break;
    vec4 scale=cascade_scales[i];vec3 uv=vec3(world_pos.xz*1000.*scale.xy,float(i));
    vec4 moment=texture(fft_normal,uv);
    float history_blend=mix(temporal_blend,1.,smoothstep(5.,8.,camera_distance));
    if(!normals_resolved)moment=mix(texture(fft_previous_normal,uv),moment,history_blend);
    gradient+=moment.xy*scale.w;
    variance+=max(0.,moment.z-dot(moment.xy,moment.xy))*scale.w*scale.w;
   }
  }
  // Same physical FFT slopes, filtered moments and pausable clock as the sea.
  // Modest attenuation suits confined water without inventing bathymetry.
  gradient=clamp(gradient*wave_intensity*inland_calmness,vec2(-.7),vec2(.7));
  vec2 across=vec2(-wind_direction.y,wind_direction.x);
  vec2 advected=world_pos.xz-wind_direction*(water_time*strategic_drift_km_s);
  vec2 wind_uv=vec2(dot(advected,wind_direction),dot(advected,across));
  float footprint=max(length(dFdx(world_pos.xz)),length(dFdy(world_pos.xz)));
  float resolved=1.-smoothstep(.05,.5,footprint);
  float strategic=smoothstep(strategic_begin_km,strategic_full_km,camera_distance)*strategic_strength;
  vec2 streak=texture(ripple_normals,wind_uv/vec2(11.,3.7)).rg*2.-1.;
  vec2 broad=texture(ripple_normals,mat2(vec2(.819,-.574),vec2(.574,.819))*wind_uv/vec2(67.,43.)+vec2(.317,.731)).rg*2.-1.;
  if(!fft_ready)gradient+=streak*.08; // Existing texture supports non-FFT fallback.
  gradient+=(wind_direction*(streak.x*.7+broad.x*.3)+across*(streak.y*.7+broad.y*.3))*strategic_normal_strength*strategic*resolved*inland_calmness;
  gradient*=1.-bank*.8;
  NORMAL=normalize(mat3(VIEW_MATRIX)*normalize(vec3(-gradient.x,1.,-gradient.y)));
  float variation=clamp(dot(broad,vec2(.8,.4))*1.5,-1.,1.);
  ALBEDO=mix(deep_color,coastal_color,.12)*(1.+variation*strategic_color_strength*strategic);
  ALBEDO=mix(ALBEDO,vec3(.075,.105,.070),bank*.65);
  // Quiet moving contact on existing river/lake ribbons. UV banks and source
  // water levels remain fixed; no ocean displacement crosses their margins.
  float margin=min(UV.x,1.-UV.x);
  float contact=(1.-smoothstep(.002,.024,margin))*(.5+.5*sin(water_time*.95+world_pos.x*31.+world_pos.z*23.));
  float broken=.5+.5*sin(world_pos.x*170.+world_pos.z*113.+sin(world_pos.z*67.)*2.);
  ALBEDO=mix(ALBEDO,vec3(.25,.31,.26),contact*broken*.23*(1.-smoothstep(20.,90.,camera_distance)));
  float rough_patch=clamp((dot(streak,vec2(.85,.35))+dot(broad,vec2(.35,.25)))*2.,-1.,1.)*resolved;
  ROUGHNESS=mix(clamp(river_roughness+sqrt(variance)*.42*inland_calmness+rough_patch*strategic_roughness_strength*strategic,.09,.5),.65,bank);
  SPECULAR=mix(river_specular,.13,bank);METALLIC=0.;
  BACKLIGHT=coastal_color*.12*(1.-bank);
 }
 if(political_blend>0.){
  vec3 chart=political_water_color(0.);
  if(political_blend>=1.){ALBEDO=chart;NORMAL=normalize(mat3(VIEW_MATRIX)*vec3(0.,1.,0.));ROUGHNESS=.78;SPECULAR=.12;BACKLIGHT=vec3(0.);}
  else{ALBEDO=mix(ALBEDO,chart,political_blend);NORMAL=normalize(mix(NORMAL,mat3(VIEW_MATRIX)*vec3(0.,1.,0.),political_blend));ROUGHNESS=mix(ROUGHNESS,.78,political_blend);SPECULAR=mix(SPECULAR,.12,political_blend);BACKLIGHT*=1.-political_blend;}
 }
}
