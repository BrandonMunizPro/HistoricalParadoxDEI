// Same integer hash and habitat function as habitat.gd, continuous across tiles.
float habitat_hash(vec2 p){
 uint n=uint(int(p.x))*374761393u+uint(int(p.y))*668265263u;
 n=(n^(n>>13u))*1274126177u;n=n^(n>>16u);
 return float(n&65535u)/65535.0;
}
float habitat_noise(vec2 p){
 vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
 return mix(mix(habitat_hash(i),habitat_hash(i+vec2(1,0)),f.x),mix(habitat_hash(i+vec2(0,1)),habitat_hash(i+vec2(1,1)),f.x),f.y);
}
float habitat_cover(vec2 p,float fertility,float dryness,float h){
 float mosaic=habitat_noise(p*.18)*.5+habitat_noise(p*.71+vec2(17,9))*.32+habitat_noise(p*4.3)*.18;
 return smoothstep(.36,.68,mosaic+(fertility-.4)*.13-dryness*.075)*(1.0-smoothstep(1.8,2.7,h));
}
