shader_type spatial;
render_mode cull_disabled;
uniform sampler2D stone:source_color,filter_linear_mipmap_anisotropic,repeat_enable;
void fragment(){
 vec2 masonry=UV/vec2(1.15,.65);masonry.x+=mod(floor(masonry.y),2.)*.5;
 vec2 f=fract(masonry);
 float joint=smoothstep(.015,.045,min(min(f.x,1.-f.x),min(f.y,1.-f.y)));
 vec3 rock=texture(stone,UV*.32).rgb;
 ALBEDO=mix(vec3(.15,.14,.105),mix(vec3(.24,.235,.17),vec3(.43,.405,.29),rock.r),joint);
 ROUGHNESS=.92;SPECULAR=.07;
 NORMAL_MAP=vec3(.5+sin(f.x*6.283)*.025,.5+cos(f.y*6.283)*.04,1.);
 NORMAL_MAP_DEPTH=.45;
}
