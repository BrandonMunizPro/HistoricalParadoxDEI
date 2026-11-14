shader_type spatial;
uniform sampler2D roof_color:source_color,filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D roof_normal:hint_normal,filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D roof_roughness:filter_linear_mipmap_anisotropic,repeat_enable;
varying vec3 position_m;
void vertex(){position_m=VERTEX*1000.0;}
void fragment(){
	vec2 p=position_m.xz/4.;
	float detail=1.-smoothstep(.15,.65,length(fwidth(p)));
	ALBEDO=texture(roof_color,p).rgb*vec3(.82,.70,.58);
	ROUGHNESS=texture(roof_roughness,p).r;
	NORMAL_MAP=texture(roof_normal,p).rgb;
	NORMAL_MAP_DEPTH=.4*detail;
}
