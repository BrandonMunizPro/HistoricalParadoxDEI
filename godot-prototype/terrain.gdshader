shader_type spatial;
render_mode cull_disabled;
uniform sampler2D coast : filter_linear, repeat_disable;
uniform sampler2D macro_color : source_color, filter_linear_mipmap_anisotropic, repeat_disable;
uniform sampler2D rock : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D grass : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D soil : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D lava : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D sand : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D rock_normal : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D grass_normal : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D lava_normal : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform vec4 children[12];
uniform int child_count=0;
uniform float reveal=1.0;
uniform float detail_strength=1.0;
uniform vec4 neighbors=vec4(1.0);
varying vec3 world_pos;
varying vec3 ground_normal;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
void vertex(){float edge=1.0;if(neighbors.x<.5)edge=min(edge,UV2.x/.08);if(neighbors.y<.5)edge=min(edge,(1.0-UV2.x)/.08);if(neighbors.z<.5)edge=min(edge,UV2.y/.08);if(neighbors.w<.5)edge=min(edge,(1.0-UV2.y)/.08);VERTEX.y=mix(COLOR.r,VERTEX.y,clamp(edge,0.0,1.0)*reveal);world_pos=VERTEX;ground_normal=NORMAL;}
void fragment(){
 float land=texture(coast,UV2).r;
 if(land<0.50)discard;
 for(int i=0;i<12;i++){if(i>=child_count)break;vec4 b=children[i];if(UV.x>b.x&&UV.y>b.y&&UV.x<b.z&&UV.y<b.w)discard;}
 if(detail_strength<.5){ALBEDO=texture(macro_color,UV).rgb*.65;ROUGHNESS=.96;SPECULAR=.1;}
 else {
 vec3 macro=texture(macro_color,UV).rgb;
 float slope=1.0-clamp(ground_normal.y,0.0,1.0);
 vec2 p=world_pos.xz;
 float h=world_pos.y;
 // Original geographic volcanic palette. This is presentation, not ancient land-cover evidence.
 vec2 geo=vec2(UV.x*87.0-12.0,62.0-UV.y*50.0);
 float etna=1.0-smoothstep(.12,.46,length((geo-vec2(15.0,37.75))*vec2(.79,1.0)));
 float ridge=smoothstep(.035,.23,slope);
 float ash=etna*smoothstep(.7,2.6,h);
 float shore=(1.0-smoothstep(.008,.10,h))*.65;
 float dry=noise(p*.7)*.45;
 vec2 uv=p*1.6;
 vec3 meadow=texture(grass,uv).rgb;
 vec3 earth=texture(soil,uv*.8).rgb;
 vec3 stone=texture(rock,uv*.6).rgb;
 vec3 volcanic=texture(lava,uv*.8).rgb;
 vec3 local=mix(meadow,earth,dry);
 local=mix(local,stone,ridge);
 local=mix(local,volcanic,ash);
 local=mix(local,texture(sand,uv).rgb,shore);
 float bands=noise(p*1.6+vec2(h*5.0,0.0))*.14+.92;
 vec3 regional=mix(macro*vec3(.86,.96,.81),local*1.65,.8*detail_strength);
 ALBEDO=regional*bands*.48;
 ROUGHNESS=mix(.96,.83,ridge);
 vec3 n=mix(texture(grass_normal,uv).rgb,texture(rock_normal,uv*.6).rgb,ridge);
 n=mix(n,texture(lava_normal,uv*.8).rgb,ash);
 NORMAL_MAP=n;
 NORMAL_MAP_DEPTH=.08*detail_strength;
 SPECULAR=.18;
 }
}
