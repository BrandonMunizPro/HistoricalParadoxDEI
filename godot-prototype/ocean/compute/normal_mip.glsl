#[compute]
#version 450
// Original normal-moment/foam reduction. XY mean slope, Z second moment, W foam.
layout(local_size_x=8,local_size_y=8,local_size_z=1) in;
layout(rgba16f,set=0,binding=0) readonly uniform image2D input_mip;
layout(rgba16f,set=0,binding=1) writeonly uniform image2D output_mip;
void main(){
 ivec2 p=ivec2(gl_GlobalInvocationID.xy),size=imageSize(output_mip);
 if(any(greaterThanEqual(p,size)))return;
 ivec2 q=p*2;
 imageStore(output_mip,p,(imageLoad(input_mip,q)+imageLoad(input_mip,q+ivec2(1,0))+imageLoad(input_mip,q+ivec2(0,1))+imageLoad(input_mip,q+ivec2(1,1)))*.25);
}
