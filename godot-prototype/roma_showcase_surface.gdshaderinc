#include "res://landscape_surface.gdshaderinc"
varying vec3 landscape_position;
varying vec3 landscape_normal;
uniform sampler2D ground_color:source_color,filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D ground_normal:hint_normal,filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D ground_roughness:filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D gravel_color:source_color,filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D path_color:source_color,filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D path_normal:hint_normal,filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D path_roughness:filter_linear_mipmap_anisotropic,repeat_enable;
uniform vec4 road_segments[32];
uniform float road_widths[32];
uniform int road_count=0;
varying vec2 metres;
float hash(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
vec3 surface_sample(sampler2D tex,vec2 p){vec2 r=mat2(vec2(.8,.6),vec2(-.6,.8))*p*.371+vec2(.31,.77);return mix(texture(tex,p).rgb,texture(tex,r).rgb,.43);}
void vertex(){metres=VERTEX.xz*1000.;landscape_position=(MODEL_MATRIX*vec4(VERTEX,1.)).xyz;landscape_normal=normalize(mat3(MODEL_MATRIX)*NORMAL);}
void fragment(){
#ifdef EDGE_BLEND
 if(COLOR.a>=.999||COLOR.a<=.001)discard;
#else
 if(COLOR.a<.999)discard;
#endif
 vec2 q=metres/8.;
 vec3 grass=surface_sample(ground_color,q);
 vec3 soil=surface_sample(gravel_color,metres/3.);
 float n=noise(metres*.08);
 float road=0.;
 for(int i=0;i<32;i++){if(i>=road_count)break;vec2 a=road_segments[i].xy,b=road_segments[i].zw,d=b-a;float t=clamp(dot(metres-a,d)/dot(d,d),0.,1.);float edge=length(metres-a-d*t)-road_widths[i]*.5;road=max(road,1.-smoothstep(-.2,1.5,edge+(n-.5)*.7));}
 float worn=clamp(max(road,max(COLOR.g,COLOR.r*.80))+(n-.5)*.06,0.,1.);
 vec3 earth=surface_sample(path_color,metres/2.).rgb*vec3(.88,.82,.72);
 vec3 rural=mix(grass,soil,.35);rural=mix(rural,vec3(dot(rural,vec3(.2126,.7152,.0722))),.4)*vec3(.9,.9,.82)*mix(.85,1.10,noise(metres*.025));
 ALBEDO=mix(rural,earth,worn);
 ROUGHNESS=mix(texture(ground_roughness,q).r,texture(path_roughness,metres/2.).r,worn);
 NORMAL_MAP=mix(texture(ground_normal,q).rgb,texture(path_normal,metres/2.).rgb,worn);NORMAL_MAP_DEPTH=.35*(1.-smoothstep(.02,.20,length(fwidth(metres/2.))));
 if(landscape_enabled){vec3 c,ln;float lr;landscape_surface(landscape_position,landscape_normal,c,ln,lr);ALBEDO=mix(c,earth,worn);ROUGHNESS=mix(lr,texture(path_roughness,metres/2.).r,worn);NORMAL=normalize(mat3(VIEW_MATRIX)*ln);NORMAL_MAP_DEPTH*=worn;}
 SPECULAR=.18;
#ifdef EDGE_BLEND
 ALPHA=COLOR.a;
#endif
}
