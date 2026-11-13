shader_type spatial;
render_mode world_vertex_coords,cull_disabled,depth_draw_never,shadows_disabled;
#include "res://coastal_focus.gdshaderinc"
uniform float water_time=0.;
varying vec3 point;
varying vec2 shore_uv;
varying vec2 style;
varying float exposure;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float field(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
void vertex(){
 shore_uv=UV;point=VERTEX;style=COLOR.rg;exposure=COLOR.b;
 float offshore=max(0.,-UV.y*1000.);
 float phase=sqrt(offshore+12.)*2.6+water_time*.86;
 VERTEX.y+=.00015+.00030*pow(max(0.,cos(phase)),4.)*smoothstep(0.,12.,offshore);
}
void fragment(){
 float coverage=focus_coast_weight(point.xz);if(coverage<.999)discard;
 float d=-shore_uv.y*1000.,along=shore_uv.x*1000.;
 if(focus_coast_streamed&&d>0.)discard; // Offshore contact is on the ocean itself.
 vec2 p=vec2(along*.12,d*.25);
 float disturbance=field(vec2(along*.035,water_time*.07));
 float phase=sqrt(max(d,0.)+12.)*2.6+water_time*.86+(disturbance-.5)*2.8;
 float crest=pow(max(0.,cos(phase)),5.);
 float breaking=(1.-smoothstep(65.,160.,d))*smoothstep(-1.,8.,d);
 float lace=field(p+vec2(water_time*.04,water_time*.13));
 float bubbles=field(p*3.1-vec2(0.,water_time*.2));
 float groups=.35+.65*smoothstep(.15,.8,field(vec2(along*.007,water_time*.045)));
 float foam=crest*breaking*smoothstep(.42,.75,lace+bubbles*.18)*groups;
 float trail=pow(max(0.,cos(phase-.65)),3.)*breaking*.38*smoothstep(.32,.65,lace);
 float reach=3.+3.*sin(water_time*.86+shore_uv.x*.6);
 float wash=(1.-smoothstep(reach-1.5,reach+1.,-d))*smoothstep(-reach-3.,-reach,d)*(1.-smoothstep(1.,9.,d));
 float water_edge=wash*(.25+.65*smoothstep(.28,.70,lace));
 if(focus_coast_streamed){
  float beach=style.x,rock=style.y;
  foam*=beach;trail*=beach;water_edge*=beach;
  // A narrow, pulsing collision fringe for rock and quiet muddy banks.
  float impact=(1.-smoothstep(2.,mix(7.,20.,rock),d))*smoothstep(-.15,1.5,d);
  impact*=pow(.5+.5*sin(water_time*1.08+along*.012+lace*3.),2.);
  foam+=impact*(1.-beach)*mix(.16,.7,rock)*smoothstep(.22,.7,lace+bubbles*.2);
  if(d<0.){foam*=beach;trail*=beach;water_edge*=beach;}
  foam*=exposure;trail*=exposure;water_edge*=mix(.4,1.,exposure);
 }
 float end_fade=1.-smoothstep(140.,180.,d);
 ALBEDO=mix(vec3(.045,.16,.15),vec3(.72,.78,.74),smoothstep(.04,.22,foam+trail));
 ALPHA=clamp((foam+trail*.6+water_edge*.7)*end_fade,0.,.94);
 ROUGHNESS=.46;SPECULAR=.32;
 NORMAL=normalize(mat3(VIEW_MATRIX)*vec3(0.,1.,0.));
}
