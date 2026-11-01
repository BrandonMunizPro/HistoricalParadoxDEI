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
vec3 political_land_color(vec2 geo,vec2 world_xz){
 vec3 color=political_neutral.rgb;
 // Externally supplied scenario cartography. Territory identity and control are
 // separate: a palette update recolors/transfers a region without editing land.
 // Transparent coverage and missing layers always resolve to neutral.
 vec2 q=(geo-political_layer_bounds.xy)/political_layer_bounds.zw;
 q.y=1.-q.y;
 if(political_layers_enabled&&all(greaterThanEqual(q,vec2(0.)))&&all(lessThanEqual(q,vec2(1.)))){
  vec4 layer=texture(political_color_layer,q);
  vec3 encoded=texture(political_boundary_layer,q).rgb;
  if(political_ids_mode){float id=round(encoded.r*255.)+round(encoded.g*255.)*256.;layer=texture(political_palette,vec2((id+.5)/float(textureSize(political_palette,0).x),.5));}
  color=mix(color,layer.rgb,layer.a);
  if(political_boundaries_enabled){
   float boundary=encoded.r;float strength=.6;
   if(political_ids_mode){
    // Screen-sized edges, not a multi-kilometre thick baked black border band.
    vec2 ex=texture(political_boundary_layer,q+dFdx(q)).rg,ey=texture(political_boundary_layer,q+dFdy(q)).rg;
    boundary=step(.001,max(length(encoded.rg-ex),length(encoded.rg-ey)))*step(.01,layer.a);
    strength=mix(.25,.75,encoded.b);
    if(encoded.b<.8)boundary*=step(.35,fract((world_xz.x+world_xz.y)*.12));
   }
   color=mix(color,color*.38,boundary*strength);
  }
 }
 // Restrained continuous engraving grain, with no invented geographic divisions.
 float grain=sin(world_xz.x*.27+sin(world_xz.y*.13))*sin(world_xz.y*.21+sin(world_xz.x*.17));
 return color*(.985+grain*.015);
}
vec3 political_water_color(float shallow){return mix(political_sea_deep.rgb,political_sea_coast.rgb,shallow*.65);}
