// Shared inverse map projection: terrain and water must clip the same shoreline.
vec2 coast_geographic(vec2 p){
 vec2 origin=vec2(.235619449,.72431164),en=vec2(p.x,-p.y);
 float rho=max(length(en),.000001),c=rho/6371.0088;
 return vec2(origin.x+atan(en.x*sin(c),rho*cos(origin.y)*cos(c)-en.y*sin(origin.y)*sin(c)),asin(cos(c)*sin(origin.y)+en.y*sin(c)*cos(origin.y)/rho))*57.295779513;
}
// Presentation reconstruction within half a source texel. Retain solid source
// pixels (including small islands); soften the bilinear diagonal corner only.
float coast_coverage(sampler2D mask,vec2 uv){
 float center=texture(mask,uv).r;
 if(center<=0.0||center>=1.0)return center;
 vec2 d=.5/vec2(textureSize(mask,0));
 float filtered=(texture(mask,uv+vec2(d.x,d.y)).r+texture(mask,uv+vec2(-d.x,d.y)).r+texture(mask,uv+vec2(d.x,-d.y)).r+texture(mask,uv-d).r)*.25;
 return mix(center,filtered,.45);
}
