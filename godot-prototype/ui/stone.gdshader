shader_type canvas_item;
// Original procedural stone grain and horizontal tooling; no external artwork.
float grain(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(grain(i),grain(i+vec2(1,0)),f.x),mix(grain(i+vec2(0,1)),grain(i+vec2(1)),f.x),f.y);}
void fragment(){
	vec4 base=COLOR;
	float grit=grain(FRAGCOORD.xy);
	vec2 p=FRAGCOORD.xy*.012;
	float cloud=noise(p)*.6+noise(p*2.7)*.3+noise(p*7.2)*.1;
	float vein=pow(1.-abs(sin(p.x*.9+p.y*.7+cloud*5.)),20.);
	float marble=step(.45,dot(base.rgb,vec3(.3,.59,.11)));
	base.rgb*=.95+grit*.05+cloud*.06-vein*.13*marble;
	COLOR=base;
}
