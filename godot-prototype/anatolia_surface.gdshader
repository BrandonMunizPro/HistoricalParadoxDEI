shader_type spatial;
render_mode cull_disabled;
#include "res://shoreline.gdshaderinc"
#include "res://political_map.gdshaderinc"
#include "res://anatolia_scope.gdshaderinc"
#include "res://anatolia_water.gdshaderinc"
uniform sampler2D macro_color : source_color,filter_linear_mipmap_anisotropic,repeat_disable;
uniform sampler2D source_normals : filter_linear_mipmap,repeat_disable;
uniform sampler2D source_metres : filter_linear,repeat_disable;
uniform sampler2D region_ids : filter_nearest,repeat_disable;
uniform sampler2D controller_ids : filter_nearest,repeat_disable;
uniform sampler2D ground_color : source_color,filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D rock_color : source_color,filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D relief_visibility : filter_linear_mipmap,repeat_disable;
uniform float camera_distance=1000.;
uniform bool detail_mesh=false;
instance uniform float terrain_reveal=1.;
uniform vec4 detail_bounds[32];
uniform int detail_count=0;
varying vec3 world_pos;
void vertex(){if(detail_mesh)VERTEX.y=mix(UV2.x,VERTEX.y,(1.-smoothstep(230.,320.,camera_distance))*terrain_reveal);world_pos=VERTEX;}
float owner_id(vec2 q){vec2 e=texture(region_ids,q).rg;float id=round(e.r*255.)+256.*round(e.g*255.);vec2 c=texture(controller_ids,vec2((id+.5)/float(textureSize(controller_ids,0).x),.5)).rg;return round(c.r*255.)+256.*round(c.g*255.);}
vec4 owner_color(vec2 q){vec2 e=texture(region_ids,q).rg;float id=round(e.r*255.)+256.*round(e.g*255.);return texture(political_palette,vec2((id+.5)/float(textureSize(political_palette,0).x),.5));}
float political_edge(vec2 q){float c=owner_id(q);vec2 dx=dFdx(q)*.85,dy=dFdy(q)*.85;return .25*(step(.5,abs(c-owner_id(q+dx+dy)))+step(.5,abs(c-owner_id(q+dx-dy)))+step(.5,abs(c-owner_id(q-dx+dy)))+step(.5,abs(c-owner_id(q-dx-dy))));}
void fragment(){
 vec2 geo=coast_geographic(world_pos.xz),q=anatolia_uv(geo);
 float scope=anatolia_scope(geo);
 if(!anatolia_detail_enabled||scope<.001)discard;
 if(anatolia_coverage(geo)<.5)discard;
 if(!detail_mesh){for(int i=0;i<32;i++){if(i>=detail_count)break;vec4 b=detail_bounds[i];if(geo.x>b.x+.002&&geo.x<b.z-.002&&geo.y>b.y+.002&&geo.y<b.w-.002)discard;}}
 vec2 nq=anatolia_texel(q,textureSize(source_normals,0));
 vec3 n=normalize(texture(source_normals,nq).rgb*2.-1.);
 float h=texture(source_metres,anatolia_texel(q,textureSize(source_metres,0))).r*.001;
 float slope=1.-clamp(n.y,0.,1.);
 vec3 macro=texture(macro_color,(UV*vec2(3915.,2250.)+.5)/vec2(3916.,2251.)).rgb;
 // Existing terrain colour family, with a restrained source-height mineral band.
 vec3 base=macro*.57;
 float exposed=smoothstep(.055,.32,slope)*.62+smoothstep(1.65,3.1,h)*.17;
 vec3 rock=texture(rock_color,world_pos.xz*.85).rgb;
 vec3 grain=texture(ground_color,world_pos.xz*1.4).rgb;
 vec3 detail=clamp(grain/vec3(.15,.16,.10),vec3(.78),vec3(1.22));
 float regional_detail=1.-smoothstep(180.,700.,camera_distance);
 base*=mix(vec3(1.),detail,regional_detail*.19);
 base=mix(base,mix(vec3(.26,.25,.21),rock*.65,.42),clamp(exposed,0.,.65));
 // Source-DEM sky visibility separates real valleys and ridges; no added peaks/noise.
 base*=mix(1.,texture(relief_visibility,nq).r,.72);
 float fill=political_blend*.24;
 if(political_layers_enabled&&fill>0.){vec4 owner=owner_color(q);vec3 political=mix(political_neutral.rgb,owner.rgb,owner.a);base=mix(base,political,fill);if(political_boundaries_enabled)base=mix(base,vec3(.065,.085,.075),political_edge(q)*.55*political_blend);}
 ALBEDO=base;
 NORMAL=normalize(mat3(VIEW_MATRIX)*n);
 ROUGHNESS=.95;SPECULAR=.12;
}
