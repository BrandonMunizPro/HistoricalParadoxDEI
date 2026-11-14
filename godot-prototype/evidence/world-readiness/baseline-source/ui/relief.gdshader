shader_type canvas_item;
void fragment(){
	vec4 source=texture(TEXTURE,vec2(UV.x,UV.y*.56));
	float grey=dot(source.rgb,vec3(.3,.59,.11));
	float edge=smoothstep(0.,.15,UV.x)*smoothstep(1.,.85,UV.x)*smoothstep(1.,.66,UV.y);
	COLOR=vec4(grey*vec3(1.02,.94,.84),edge*.85);
}
