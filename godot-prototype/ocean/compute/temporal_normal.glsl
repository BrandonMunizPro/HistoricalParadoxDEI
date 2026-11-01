#[compute]
#version 450
// Interpolate moment fields once per texel, rather than twice per shaded pixel.
layout(local_size_x=8,local_size_y=8,local_size_z=1) in;
layout(rgba16f,set=0,binding=0) readonly uniform image2DArray previous_normal;
layout(rgba16f,set=0,binding=1) readonly uniform image2DArray current_normal;
layout(rgba16f,set=0,binding=2) writeonly uniform image2DArray display_normal;
layout(push_constant) uniform Parameters {float alpha;};
void main(){ivec3 p=ivec3(gl_GlobalInvocationID.xyz);if(any(greaterThanEqual(p,imageSize(display_normal))))return;imageStore(display_normal,p,mix(imageLoad(previous_normal,p),imageLoad(current_normal,p),alpha));}
