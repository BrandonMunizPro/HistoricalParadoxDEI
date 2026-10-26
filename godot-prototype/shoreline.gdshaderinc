// Shared inverse map projection: terrain and water must clip the same shoreline.
vec2 coast_geographic(vec2 p){
 vec2 origin=vec2(.235619449,.72431164),en=vec2(p.x,-p.y);
 float rho=max(length(en),.000001),c=rho/6371.0088;
 return vec2(origin.x+atan(en.x*sin(c),rho*cos(origin.y)*cos(c)-en.y*sin(origin.y)*sin(c)),asin(cos(c)*sin(origin.y)+en.y*sin(c)*cos(origin.y)/rho))*57.295779513;
}
