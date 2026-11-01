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
global uniform sampler2D political_boundary_layer : filter_nearest,repeat_disable;
global uniform sampler2D political_palette : source_color,filter_nearest,repeat_disable;
global uniform bool political_ids_mode;
vec4 political_owner_color(vec2 q){
 vec2 encoded=texture(political_boundary_layer,q).rg;
 float id=round(encoded.r*255.)+round(encoded.g*255.)*256.;
 return texture(political_palette,vec2((id+.5)/float(textureSize(political_palette,0).x),.5));
}
float political_owner_edge(vec4 center,vec4 neighbor){
 // Controller colors, not territory IDs: a transfer between friendly regions
 // must not leave a false political border. Transparent land is neutral.
 return step(.018,length(center-neighbor));
}
vec3 political_land_color(vec2 geo,vec2 world_xz){
 vec3 color=political_neutral.rgb;
 // Externally supplied scenario cartography. Territory identity and control are
 // separate: a palette update recolors/transfers a region without editing land.
 // Transparent coverage and missing layers always resolve to neutral.
 vec2 q=(geo-political_layer_bounds.xy)/political_layer_bounds.zw;
 q.y=1.-q.y;
 if(political_layers_enabled&&all(greaterThanEqual(q,vec2(0.)))&&all(lessThanEqual(q,vec2(1.)))){
  vec4 layer;
  vec3 encoded=texture(political_boundary_layer,q).rgb;
  if(political_ids_mode){layer=political_owner_color(q);}else{layer=texture(political_color_layer,q);}
  color=mix(color,layer.rgb,layer.a);
  if(political_boundaries_enabled){
   float boundary=encoded.r;float strength=.6;
   if(political_ids_mode){
    // Continuous 2.4-pixel seams in both directions at every zoom/rotation.
    // Confidence remains in the roster/data, rather than hiding tribal edges.
    vec2 dx=dFdx(q)*1.2,dy=dFdy(q)*1.2;
    boundary=max(max(political_owner_edge(layer,political_owner_color(q+dx)),political_owner_edge(layer,political_owner_color(q-dx))),max(political_owner_edge(layer,political_owner_color(q+dy)),political_owner_edge(layer,political_owner_color(q-dy))));
    boundary*=step(.01,layer.a);
    // A second, wider engraved rim separates deep faction fields from the seam.
    vec2 hx=dx*1.9,hy=dy*1.9;
    float rim=max(max(political_owner_edge(layer,political_owner_color(q+hx)),political_owner_edge(layer,political_owner_color(q-hx))),max(political_owner_edge(layer,political_owner_color(q+hy)),political_owner_edge(layer,political_owner_color(q-hy))));
    color=mix(color,mix(color,vec3(.57,.49,.34),.18),rim*(1.-boundary)*step(.01,layer.a));
    strength=.80;
   }
   color=mix(color,vec3(.028,.026,.032),boundary*strength);
  }
 }
 // Restrained continuous engraving grain, with no invented geographic divisions.
 float grain=sin(world_xz.x*.27+sin(world_xz.y*.13))*sin(world_xz.y*.21+sin(world_xz.x*.17));
 return color*(.985+grain*.015);
}
vec3 political_water_color(float shallow){return mix(political_sea_deep.rgb,political_sea_coast.rgb,shallow*.65);}
