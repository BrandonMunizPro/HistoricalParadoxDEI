// Bounded local rendering refinement; inactive outside the Pellaro focus area.
#include "res://coast_baseline.gdshaderinc"
uniform bool focus_coast_enabled=false;
uniform bool focus_coast_streamed=false;
uniform sampler2D focus_coast_distance : filter_linear,repeat_disable;
uniform sampler2D focus_coast_coverage : filter_linear,repeat_disable;
uniform vec4 focus_coast_bounds=vec4(0.);
vec2 focus_coast_uv(vec2 p){return (p-focus_coast_bounds.xy)/focus_coast_bounds.zw;}
float focus_coast_local_weight(vec2 p){
 if(!focus_coast_enabled)return 0.;
 vec2 q=focus_coast_uv(p);
 if(any(lessThan(q,vec2(0.)))||any(greaterThan(q,vec2(1.))))return 0.;
 vec2 size=vec2(textureSize(focus_coast_coverage,0));
 if(focus_coast_streamed){vec2 s=vec2(textureSize(focus_coast_distance,0));return abs(texture(focus_coast_distance,(q*(s-1.)+.5)/s).r)<.54?1.:0.;}
 return texture(focus_coast_coverage,(q*(size-1.)+.5)/size).r;
}
vec4 focus_coast_sample(vec2 p){
 if(focus_coast_local_weight(p)>.999){
  vec2 s=vec2(textureSize(focus_coast_distance,0));
  vec4 value=texture(focus_coast_distance,(focus_coast_uv(p)*(s-1.)+.5)/s);
  return focus_coast_streamed?value:vec4(value.r,0.,1.,0.);
 }
 return coast_baseline_sample(p);
}
float focus_coast_weight(vec2 p){
 float local=focus_coast_local_weight(p);
 if(local>.999)return local;
 return abs(coast_baseline_sample(p).r)<.20?1.:0.;
}
vec2 focus_coast_style(vec2 p){
 return focus_coast_sample(p).ba;
}
float focus_coast_cut_metres(vec2 p){return (focus_coast_streamed||coast_baseline_enabled)?mix(8.,100.,focus_coast_style(p).x):100.;}
float focus_coast_metres(vec2 p){
 return focus_coast_sample(p).r*1000.;
}
float focus_coast_terrain_land(vec2 p,float original){
 vec4 coast=focus_coast_sample(p);
 if(abs(coast.r)<.2)return step(0.,coast.r);
 return original;
}
vec2 focus_coast_terrain_surface(vec2 p,float original){
 vec4 coast=focus_coast_sample(p);
 if(abs(coast.r)>=.2)return vec2(original,0.);
 float cut=(focus_coast_streamed||coast_baseline_enabled)?mix(.008,.10,coast.b):.10;
 // Only a completed detailed strip may carve the underlying land. The
 // persistent strip enhances the continuous parent instead of cutting a hole
 // whose join height depends on a not-yet-resident near terrain tile.
 bool refined=focus_coast_local_weight(p)>.999;
 return vec2(step(0.,coast.r),refined&&coast.r>=0.&&coast.r<cut?1.:0.);
}
float focus_coast_vertex_damping(vec2 p){
 if(coast_baseline_enabled&&focus_coast_local_weight(p)<.999){float d=coast_baseline_sample(p).r;if(abs(d)>.20)return 1.;return d>=0.?0.:smoothstep(0.,.06,-d);}
 if(!focus_coast_enabled||!focus_coast_streamed)return 1.;
 vec2 q=focus_coast_uv(p);
 if(any(lessThan(q,vec2(0.)))||any(greaterThan(q,vec2(1.))))return 1.;
 vec2 size=vec2(textureSize(focus_coast_distance,0));
 float d=textureLod(focus_coast_distance,(q*(size-1.)+.5)/size,0.).r;
 if(abs(d)>.54)return 1.;
 return d>=0.?0.:smoothstep(0.,.06,-d);
}
