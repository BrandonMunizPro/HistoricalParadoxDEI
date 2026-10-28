// Interpretive authoring scope, not a geographical or political boundary.
// The curved northern limit lies in the Mediterranean and excludes Sicily/Italy.
uniform vec4 na_scope_rules=vec4(8.0,18.0,38.0,34.0);
uniform vec4 na_plain_rules=vec4(.35,.72,.15,.55);
float na_scope(vec2 geo){
 float north=mix(na_scope_rules.z,na_scope_rules.w,smoothstep(na_scope_rules.x,na_scope_rules.y,geo.x));
 return smoothstep(12.0,18.0,geo.y)*(1.0-smoothstep(north-1.0,north,geo.y))*(1.0-smoothstep(36.0,39.0,geo.x));
}
float na_plain(vec4 climate,float height,float slope){
 return smoothstep(na_plain_rules.x,na_plain_rules.y,climate.g)*(1.0-smoothstep(na_plain_rules.z,na_plain_rules.w,height))*(1.0-smoothstep(.015,.08,slope));
}
