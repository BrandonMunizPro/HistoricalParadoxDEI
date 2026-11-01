// Presentation only. Geographic UVs are the existing longitude/latitude grid.
global uniform float political_blend;
global uniform vec4 political_neutral;
global uniform vec4 political_sea_deep;
global uniform vec4 political_sea_coast;
global uniform float political_coast_band_km;
global uniform bool political_layers_enabled;
global uniform bool political_boundaries_enabled;
global uniform vec4 political_layer_bounds;
global uniform sampler2D political_color_layer : source_color,filter_linear,repeat_disable;
global uniform sampler2D political_boundary_layer : filter_linear,repeat_disable;
vec3 political_land_color(vec2 geo,vec2 world_xz){
 vec3 color=political_neutral.rgb;
 // Future externally supplied cartography, rasterized from actual territory data.
 // Transparent coverage and missing layers always resolve to neutral.
 vec2 q=(geo-political_layer_bounds.xy)/political_layer_bounds.zw;
 q.y=1.-q.y;
 if(political_layers_enabled&&all(greaterThanEqual(q,vec2(0.)))&&all(lessThanEqual(q,vec2(1.)))){
  vec4 layer=texture(political_color_layer,q);color=mix(color,layer.rgb,layer.a);
  if(political_boundaries_enabled){float boundary=texture(political_boundary_layer,q).r;color=mix(color,color*.46,boundary*.6);}
 }
 // Restrained continuous engraving grain, with no invented geographic divisions.
 float grain=sin(world_xz.x*.27+sin(world_xz.y*.13))*sin(world_xz.y*.21+sin(world_xz.x*.17));
 return color*(.985+grain*.015);
}
vec3 political_water_color(float shallow){return mix(political_sea_deep.rgb,political_sea_coast.rgb,shallow*.65);}
