// Bounded local rendering refinement; inactive outside the Pellaro focus area.
uniform bool focus_coast_enabled=false;
uniform bool focus_coast_streamed=false;
uniform sampler2D focus_coast_distance : filter_linear,repeat_disable;
uniform sampler2D focus_coast_coverage : filter_linear,repeat_disable;
uniform vec4 focus_coast_bounds=vec4(0.);
vec2 focus_coast_uv(vec2 p){return (p-focus_coast_bounds.xy)/focus_coast_bounds.zw;}
float focus_coast_weight(vec2 p){
 if(!focus_coast_enabled)return 0.;
 vec2 q=focus_coast_uv(p);
 if(any(lessThan(q,vec2(0.)))||any(greaterThan(q,vec2(1.))))return 0.;
 vec2 size=vec2(textureSize(focus_coast_coverage,0));
 if(focus_coast_streamed){vec2 s=vec2(textureSize(focus_coast_distance,0));return abs(texture(focus_coast_distance,(q*(s-1.)+.5)/s).r)<.54?1.:0.;}
 return texture(focus_coast_coverage,(q*(size-1.)+.5)/size).r;
}
vec2 focus_coast_style(vec2 p){
 if(!focus_coast_streamed)return vec2(1.,0.);
 vec2 size=vec2(textureSize(focus_coast_distance,0));
 return texture(focus_coast_distance,(focus_coast_uv(p)*(size-1.)+.5)/size).ba;
}
float focus_coast_cut_metres(vec2 p){return focus_coast_streamed?100.*smoothstep(.35,.75,focus_coast_style(p).x):100.;}
float focus_coast_metres(vec2 p){
 vec2 size=vec2(textureSize(focus_coast_distance,0));
 return texture(focus_coast_distance,(focus_coast_uv(p)*(size-1.)+.5)/size).r*1000.;
}
float focus_coast_terrain_land(vec2 p,float original){
 if(focus_coast_weight(p)>.999&&abs(focus_coast_metres(p))<200.)return step(0.,focus_coast_metres(p));
 return original;
}
float focus_coast_vertex_damping(vec2 p){
 if(!focus_coast_enabled||!focus_coast_streamed)return 1.;
 vec2 q=focus_coast_uv(p);
 if(any(lessThan(q,vec2(0.)))||any(greaterThan(q,vec2(1.))))return 1.;
 vec2 size=vec2(textureSize(focus_coast_distance,0));
 float d=textureLod(focus_coast_distance,(q*(size-1.)+.5)/size,0.).r;
 if(abs(d)>.54)return 1.;
 return d>=0.?0.:smoothstep(0.,.06,-d);
}
