uniform sampler2D anatolia_land : filter_linear,repeat_disable;
uniform sampler2D anatolia_ocean : filter_linear,repeat_disable;
uniform sampler2D anatolia_shore : filter_linear,repeat_disable;
vec2 anatolia_uv(vec2 geo){return vec2((geo.x-25.)/18.,(43.-geo.y)/8.);}
vec2 anatolia_texel(vec2 q,ivec2 size){return (q*(vec2(size)-1.)+.5)/vec2(size);}
float anatolia_coverage(vec2 geo){return coast_coverage(anatolia_land,anatolia_texel(anatolia_uv(geo),textureSize(anatolia_land,0)));}
