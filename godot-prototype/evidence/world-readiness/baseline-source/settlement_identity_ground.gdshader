shader_type spatial;
render_mode cull_back,depth_prepass_alpha;
uniform sampler2D soil_color:source_color,filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D soil_normal:hint_normal,filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D soil_roughness:filter_linear_mipmap_anisotropic,repeat_enable;
uniform bool cultivated=false;
uniform bool fallow=false;
uniform vec2 half_size=vec2(1.0);
void fragment(){
 vec3 soil=texture(soil_color,UV*.45).rgb;
 float furrow=smoothstep(.15,.8,.5+.5*sin(UV.x*8.7));
 vec3 field=mix(soil*vec3(.95,.86,.66),vec3(.47,.43,.20),furrow*.65);
 ALBEDO=cultivated?(fallow?soil*vec3(.95,.83,.65):field):soil*vec3(.95,.86,.72);
 NORMAL_MAP=texture(soil_normal,UV*.45).rgb;NORMAL_MAP_DEPTH=.12*(1.0-smoothstep(.015,.07,length(fwidth(UV*.45))));
 ROUGHNESS=max(.75,texture(soil_roughness,UV*.45).r);SPECULAR=.15;
 float edge=min(half_size.x-abs(UV.x),half_size.y-abs(UV.y));
 ALPHA=smoothstep(0.0,2.0,edge);
}
