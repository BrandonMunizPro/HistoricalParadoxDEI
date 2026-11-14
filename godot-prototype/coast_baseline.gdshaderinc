// Sparse, exact catalog lookup. No camera-triggered bake or lossy raster coast.
uniform bool coast_baseline_enabled=false;
uniform sampler2D coast_baseline_segments:filter_nearest,repeat_disable;
uniform sampler2D coast_baseline_pages:filter_nearest,repeat_disable;
uniform sampler2D coast_baseline_cells:filter_nearest,repeat_disable;
uniform sampler2D coast_baseline_indices:filter_nearest,repeat_disable;
uniform vec2 coast_baseline_page_origin;
vec4 coast_baseline_fetch(sampler2D tex,int index){
 int width=textureSize(tex,0).x;
 return texelFetch(tex,ivec2(index%width,index/width),0);
}
vec4 coast_baseline_sample(vec2 p){
 if(!coast_baseline_enabled)return vec4(1.,0.,0.,0.);
 ivec2 cell=ivec2(floor(p*2.)),page=ivec2(floor(p/16.))-ivec2(coast_baseline_page_origin);
 ivec2 size=textureSize(coast_baseline_pages,0);
 if(any(lessThan(page,ivec2(0)))||any(greaterThanEqual(page,size)))return vec4(1.,0.,0.,0.);
 int id=int(texelFetch(coast_baseline_pages,page,0).r)-1;
 if(id<0)return vec4(1.,0.,0.,0.);
 ivec2 local=ivec2(mod(vec2(cell),vec2(32.)));
 vec2 header=coast_baseline_fetch(coast_baseline_cells,id*1024+local.y*32+local.x).rg;
 float best=.22;vec4 result=vec4(1.,0.,0.,0.);
 for(int i=0;i<int(header.y);i++){
  int segment=int(coast_baseline_fetch(coast_baseline_indices,int(header.x)+i).r);
  vec4 ends=coast_baseline_fetch(coast_baseline_segments,segment*3);
  vec4 basis=coast_baseline_fetch(coast_baseline_segments,segment*3+1);
  vec2 tangent=ends.zw-ends.xy;
  float t=clamp(dot(p-ends.xy,tangent)/max(dot(tangent,tangent),.000000001),0.,1.);
  vec2 delta=p-ends.xy-tangent*t;float d=length(delta);
  if(d<best){best=d;vec2 style=coast_baseline_fetch(coast_baseline_segments,segment*3+2).rg;result=vec4(d*sign(dot(delta,basis.xy)),mod(basis.z+basis.w*t,4.096),style);}
 }
 return result;
}
