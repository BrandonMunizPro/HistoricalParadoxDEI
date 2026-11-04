shader_type spatial;
render_mode world_vertex_coords,cull_disabled,alpha_to_coverage;
#include "res://scenery_fade.gdshaderinc"
uniform sampler2D atlas:source_color,filter_linear_mipmap_anisotropic,repeat_disable;
uniform vec3 asset_center=vec3(0.);
uniform float asset_width=.03;
uniform bool stand=false;
uniform float camera_distance=1.;
uniform float foliage_time=0.;
varying vec2 view_index;
void vertex(){
 float tree_scale=stand?.55:1.;
 vec3 center=asset_center*tree_scale+vec3(UV2.x,0.,UV2.y);
 vec3 world_center=(MODEL_MATRIX*vec4(center,1.)).xyz;
 vec3 world_direction=CAMERA_POSITION_WORLD-world_center;
 vec3 direction=vec3(dot(world_direction,normalize(MODEL_MATRIX[0].xyz)),dot(world_direction,normalize(MODEL_MATRIX[1].xyz)),dot(world_direction,normalize(MODEL_MATRIX[2].xyz)));
 float azimuth=mod(atan(direction.x,direction.z)+6.283185307,6.283185307);
 float elevation=degrees(atan(direction.y,length(direction.xz)));
 view_index=vec2(azimuth*(8./6.283185307),clamp((elevation-15.)/35.,0.,2.));
 float scale_x=length(MODEL_MATRIX[0].xyz),scale_y=length(MODEL_MATRIX[1].xyz);
 float fade=mix(1.,smoothstep(8.,35.,camera_distance),INSTANCE_CUSTOM.x);
 fade*=mix(1.,1.-smoothstep(12.,32.,camera_distance),INSTANCE_CUSTOM.y);
 vec2 quad=vec2(UV.x-.5,.5-UV.y)*asset_width*tree_scale;
 vec3 world_vertex=world_center+(INV_VIEW_MATRIX[0].xyz*quad.x*scale_x+INV_VIEW_MATRIX[1].xyz*quad.y*scale_y)*fade;
 world_vertex.y+=(UV2.x*INSTANCE_CUSTOM.z+UV2.y*INSTANCE_CUSTOM.w)*scale_y;
 world_vertex.x+=sin(foliage_time*.8+world_center.x*17.)*.00008*UV.y;
 VERTEX=world_vertex;
 NORMAL=vec3(0.,1.,0.);
}
vec4 frame(vec2 cell,vec2 local_uv){
 vec2 uv=(cell+local_uv)/vec2(8.,3.);
 return textureGrad(atlas,uv,dFdx(local_uv)/vec2(8.,3.),dFdy(local_uv)/vec2(8.,3.));
}
void fragment(){
	if(scenery_reveal<.999&&scenery_pixel_threshold(FRAGCOORD.xy)>scenery_reveal)discard;
 vec2 lo=floor(view_index),weight=fract(view_index);
 vec2 hi=vec2(mod(lo.x+1.,8.),min(lo.y+1.,2.));
 vec4 color=mix(mix(frame(lo,UV),frame(vec2(hi.x,lo.y),UV),weight.x),mix(frame(vec2(lo.x,hi.y),UV),frame(hi,UV),weight.x),weight.y);
 ALPHA=color.a;ALPHA_SCISSOR_THRESHOLD=.18;ALPHA_ANTIALIASING_EDGE=.10;ALPHA_TEXTURE_COORDINATE=UV;
 ALBEDO=color.rgb*vec3(.54,.58,.48);
 NORMAL=normalize(mat3(VIEW_MATRIX)*vec3(0.,1.,0.));
 ROUGHNESS=.95;SPECULAR=.08;
}
