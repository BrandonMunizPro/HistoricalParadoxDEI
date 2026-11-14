shader_type spatial;
render_mode cull_disabled,depth_prepass_alpha;
uniform sampler2D ground_color:source_color,filter_linear_mipmap_anisotropic,repeat_enable;
void fragment(){
	vec3 soil=texture(ground_color,UV*.15).rgb;
	float grain=texture(ground_color,UV*.52).r;
	ALBEDO=mix(vec3(.105,.080,.045),vec3(.25,.19,.115),soil.r)*mix(.9,1.1,grain);
	ROUGHNESS=clamp(.78+grain*.2,0.,1.);
	NORMAL_MAP=vec3(.5+(dFdx(grain))*.25,.5+(dFdy(grain))*.25,1.);
	NORMAL_MAP_DEPTH=.25;
	ALPHA=smoothstep(.0,.18,min(UV2.x,1.-UV2.x)+(grain-.5)*.035);
}
