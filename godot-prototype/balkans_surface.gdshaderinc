// Sourced physical detail; no procedural peaks, snow additions or political geometry.
uniform bool balkans_detail_enabled=false;
uniform bool balkans_overlay_mesh=false;
uniform sampler2D balkans_source_metres : filter_linear,repeat_disable;
uniform sampler2D balkans_source_normals : filter_linear_mipmap,repeat_disable;
uniform sampler2D balkans_land : filter_linear,repeat_disable;
uniform sampler2D balkans_ocean : filter_linear,repeat_disable;
uniform sampler2D balkans_shore : filter_linear,repeat_disable;
vec2 balkans_uv(vec2 geo){return vec2((geo.x-14.)/11.,(46.-geo.y)/10.);}
vec2 balkans_texel(vec2 q,ivec2 size){return (q*(vec2(size)-1.)+.5)/vec2(size);}
float balkans_coverage(vec2 geo){
 vec2 q=balkans_uv(geo);
 return coast_coverage(balkans_land,balkans_texel(q,textureSize(balkans_land,0)));
}
