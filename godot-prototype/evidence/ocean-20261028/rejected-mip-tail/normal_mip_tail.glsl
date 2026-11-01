#[compute]
#version 450
// The final five mip levels fit in one workgroup, avoiding tiny dispatches.
layout(local_size_x=16,local_size_y=16,local_size_z=1) in;
layout(rgba16f,set=0,binding=0) readonly uniform image2D input32;
layout(rgba16f,set=0,binding=1) writeonly uniform image2D output16;
layout(rgba16f,set=0,binding=2) writeonly uniform image2D output8;
layout(rgba16f,set=0,binding=3) writeonly uniform image2D output4;
layout(rgba16f,set=0,binding=4) writeonly uniform image2D output2;
layout(rgba16f,set=0,binding=5) writeonly uniform image2D output1;
shared vec4 moment[256];
vec4 half_round(vec4 v){return vec4(unpackHalf2x16(packHalf2x16(v.xy)),unpackHalf2x16(packHalf2x16(v.zw)));}
void main(){
 ivec2 p=ivec2(gl_LocalInvocationID.xy),q=p*2;
 vec4 value=half_round((imageLoad(input32,q)+imageLoad(input32,q+ivec2(1,0))+imageLoad(input32,q+ivec2(0,1))+imageLoad(input32,q+ivec2(1,1)))*.25);
 moment[p.y*16+p.x]=value;imageStore(output16,p,value);barrier();
 for(int size=8;size>=1;size/=2){
  vec4 next=vec4(0.);
  if(p.x<size&&p.y<size){int a=p.y*2*16+p.x*2;next=half_round((moment[a]+moment[a+1]+moment[a+16]+moment[a+17])*.25);}
  barrier();
  if(p.x<size&&p.y<size){moment[p.y*16+p.x]=next;if(size==8)imageStore(output8,p,next);else if(size==4)imageStore(output4,p,next);else if(size==2)imageStore(output2,p,next);else imageStore(output1,p,next);}
  barrier();
 }
}
