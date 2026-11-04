// Physical presentation footprint. Never used for ownership or settlement membership.
uniform bool anatolia_detail_enabled=false;
float anatolia_scope(vec2 geo){
 float south=35.8+1.5*smoothstep(35.8,39.5,geo.x);
 float north=40.4+1.5*smoothstep(28.6,29.2,geo.x);
 return smoothstep(25.8,26.2,geo.x)*(1.-smoothstep(42.2,42.6,geo.x))*smoothstep(south-.2,south+.2,geo.y)*(1.-smoothstep(north-.2,north+.2,geo.y));
}
