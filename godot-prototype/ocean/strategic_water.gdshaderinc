// Nonperiodic offshore colour, not bathymetry or kilometre-scale waves.
// Reuses the source shoreline distance and the ocean shader's value field.
uniform vec2 overview_distance_km=vec2(24.,520.);
uniform float basin_scale_km=420.;
uniform float basin_color_strength=.18;
uniform float overview_strength=1.;
vec3 campaign_chart_water(vec2 p,float shallow,vec3 original,float distance){
 float blend=smoothstep(overview_distance_km.x,overview_distance_km.y,distance)*overview_strength;
 if(blend<=0.)return original;
 vec2 q=p/max(100.,basin_scale_km);
 float basin=basin_field(q+vec2(1.73,6.19));
 float shelf=basin_field(mat2(vec2(.819,-.574),vec2(.574,.819))*q*3.1+vec2(7.1,2.4));
 float broad=.5+.5*basin;
 vec3 deep=political_sea_deep.rgb*mix(vec3(.48,.66,.86),vec3(.78,.96,1.04),broad);
 deep*=1.+shelf*basin_color_strength;
 vec3 coast=political_sea_coast.rgb*(.97+basin*.025);
 return mix(original,mix(deep,coast,shallow),blend);
}
