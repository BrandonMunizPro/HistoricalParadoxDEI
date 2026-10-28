// Same family blending as environment_rules.gd; no Italian style rectangle.
uniform vec4 environment_latitude_rules=vec4(40.0,49.0,.20,.65);
uniform vec4 environment_dry_river_rules=vec4(.25,.65,.08,.65);
uniform vec4 environment_cover=vec4(.85,.92,.12,.78);
vec4 environment_weights(float latitude,vec4 climate){
 float temperate=smoothstep(environment_latitude_rules.x,environment_latitude_rules.y,latitude)*(1.0-smoothstep(environment_latitude_rules.z,environment_latitude_rules.w,climate.b));
 float dry=smoothstep(environment_dry_river_rules.x,environment_dry_river_rules.y,climate.b);
 float river=smoothstep(environment_dry_river_rules.z,environment_dry_river_rules.w,climate.a);
 return vec4((1.0-dry)*(1.0-temperate)*(1.0-river),(1.0-dry)*temperate*(1.0-river),dry*(1.0-river),river);
}
