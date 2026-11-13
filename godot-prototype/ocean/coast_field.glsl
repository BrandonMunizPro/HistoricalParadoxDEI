#[compute]
#version 450
layout(local_size_x=8,local_size_y=8,local_size_z=1) in;
layout(rgba32f,set=0,binding=0) uniform writeonly image2D output_field;
layout(std430,set=0,binding=1) readonly buffer Segments { vec4 segments[]; };
layout(std430,set=0,binding=2) readonly buffer Cells { int cells[]; };
layout(push_constant,std430) uniform Params { vec4 bounds; ivec4 dimensions; } p;
void main(){
 ivec2 pixel=ivec2(gl_GlobalInvocationID.xy);
 if(any(greaterThanEqual(pixel,p.dimensions.xy)))return;
 vec2 uv=vec2(pixel)/vec2(p.dimensions.xy-1);
 vec2 point=p.bounds.xy+uv*p.bounds.zw;
 ivec2 bin=min(ivec2(uv*32.),ivec2(31));int h=(bin.y*32+bin.x)*2;
 int start=cells[h],count=cells[h+1];float best=.55;vec4 value=vec4(64.,0.,0.,0.);
 for(int i=0;i<count;i++){
  int id=cells[2048+start+i];vec4 edge=segments[id*3],info=segments[id*3+1],style=segments[id*3+2];
  vec2 tangent=edge.zw-edge.xy;float t=clamp(dot(point-edge.xy,tangent)/dot(tangent,tangent),0.,1.);
  vec2 delta=point-edge.xy-tangent*t;float d=length(delta);
  if(d<best){best=d;value=vec4(d*(dot(delta,info.xy)>=0.?1.:-1.),(info.z+t*abs(info.w))*sign(info.w),mix(style.xy,style.zw,t));}
 }
 imageStore(output_field,pixel,value);
}
