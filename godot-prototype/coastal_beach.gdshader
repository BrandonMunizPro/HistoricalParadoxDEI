shader_type spatial;
render_mode world_vertex_coords,cull_disabled;
#include "res://coastal_focus.gdshaderinc"
uniform float water_time=0.;
uniform sampler2D sand_texture : source_color,filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D ground_texture : source_color,filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D rock_texture : source_color,filter_linear_mipmap_anisotropic,repeat_enable;
varying vec3 point;
varying float shore;
varying vec3 beach_normal;
varying vec2 style;
float grain(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void vertex(){point=VERTEX;shore=UV.y;beach_normal=NORMAL;style=COLOR.rg;}
void fragment(){
 if(focus_coast_weight(point.xz)<.999)discard;
 float metres=shore*1000.;
 float wash=3.+3.*sin(water_time*.86+UV.x*.6);
 float wet=1.-smoothstep(wash+2.,wash+9.,metres);
 float detail=grain(floor(point.xz*100000.));
 vec3 sand=texture(sand_texture,point.xz*240.).rgb*vec3(1.65,1.58,1.44);
 sand*=.90+detail*.20;
 float pebbles=smoothstep(.84,.98,grain(floor(point.xz*21000.)));
 sand=mix(sand,vec3(.20,.205,.19),pebbles*.28);
 ALBEDO=sand*mix(1.,.43,wet);
 vec3 ground=texture(ground_texture,point.xz*80.).rgb*vec3(.76,1.12,.68)*.90;
 float transition=smoothstep(28.,82.,metres+(grain(floor(point.xz*650.))-.5)*12.);
 ALBEDO=mix(ALBEDO,ground,transition);
 if(focus_coast_streamed){
  float beach=style.x,rock=style.y,cut=mix(8.,100.,beach);
  if(metres>cut+20.)discard;
  vec3 weights=pow(abs(beach_normal),vec3(4.));weights/=max(.001,weights.x+weights.y+weights.z);
  vec3 mineral=(texture(rock_texture,point.zy*125.).rgb*weights.x+texture(rock_texture,point.xz*125.).rgb*weights.y+texture(rock_texture,point.xy*125.).rgb*weights.z)*.8;
  vec3 bank=texture(ground_texture,point.xz*160.).rgb*vec3(.65,.72,.60);
  vec3 edge=mix(bank,mineral,rock)*mix(1.,.52,wet);
  ALBEDO=mix(edge,ALBEDO,beach);
  ALBEDO=mix(ALBEDO,ground,(1.-beach)*smoothstep(cut,cut+20.,metres));
 }
 ROUGHNESS=mix(.92,.22,wet);SPECULAR=mix(.25,.48,wet);
 NORMAL=normalize(mat3(VIEW_MATRIX)*beach_normal);
}
