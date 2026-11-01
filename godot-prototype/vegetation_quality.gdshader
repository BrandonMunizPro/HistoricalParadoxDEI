shader_type spatial;
render_mode cull_disabled, alpha_to_coverage;
uniform sampler2D leaf_color:source_color,filter_linear_mipmap_anisotropic,repeat_disable;
uniform sampler2D bark_color:source_color,filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D bark_normal:hint_normal,filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D bark_roughness:filter_linear_mipmap_anisotropic,repeat_enable;
uniform bool woody=false;
uniform float camera_distance=1.;
uniform float foliage_time=0.;
uniform vec2 coarse_transition_km=vec2(8.,35.);
uniform vec2 local_transition_km=vec2(12.,32.);
varying float height;
void vertex(){
 height=VERTEX.y;
 float proxy=smoothstep(coarse_transition_km.x,coarse_transition_km.y,camera_distance);
 VERTEX*=mix(1.,proxy,INSTANCE_CUSTOM.x);
 VERTEX*=mix(1.,1.-smoothstep(local_transition_km.x,local_transition_km.y,camera_distance),INSTANCE_CUSTOM.y);
 VERTEX.y+=VERTEX.x*INSTANCE_CUSTOM.z+VERTEX.z*INSTANCE_CUSTOM.w;
 vec2 anchor=MODEL_MATRIX[3].xz;
 float wind=sin(foliage_time*.8+anchor.x*17.+anchor.y*13.);
 float flexibility=smoothstep(.001,.024,height);
 VERTEX.x+=wind*flexibility*(.00006+(woody?0.:.00009)*sin(foliage_time*1.7+VERTEX.y*2500.));
}
void fragment(){
 if(!FRONT_FACING)NORMAL=-NORMAL;
 if(woody){
  ALBEDO=texture(bark_color,UV).rgb;
  NORMAL_MAP=texture(bark_normal,UV).rgb;
  ROUGHNESS=texture(bark_roughness,UV).r;
  SPECULAR=.12;
 }else{
  vec4 leaf=texture(leaf_color,UV);
  ALPHA=leaf.a;
  ALPHA_SCISSOR_THRESHOLD=mix(.35,.22,smoothstep(1.,15.,camera_distance));
  ALPHA_ANTIALIASING_EDGE=.12;
  ALPHA_TEXTURE_COORDINATE=UV;
  // Real branch cutouts provide holes, fine silhouettes and crown self-shadow.
  ALBEDO=leaf.rgb*mix(.68,.94,smoothstep(.002,.020,height));
  ROUGHNESS=.84;SPECULAR=.20;BACKLIGHT=ALBEDO*.30;
 }
}
