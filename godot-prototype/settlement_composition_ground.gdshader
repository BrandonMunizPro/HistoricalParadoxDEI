shader_type spatial;
render_mode depth_prepass_alpha;
// Original texture-free worn soil/paving. UV is in metres; UV2 controls edges.
float grain(vec2 p) {
    return fract(sin(dot(floor(p),vec2(127.1,311.7)))*43758.5453);
}
void fragment() {
    float noise=mix(grain(UV*.7),grain(UV*2.1),.35);
    ALBEDO=pow(COLOR.rgb,vec3(2.2))*mix(.9,1.08,noise);
    ROUGHNESS=.97;
    float edge=smoothstep(.0,.22,min(UV2.x,1.-UV2.x)+(noise-.5)*.055);
    if(COLOR.a<.9) {
        edge*=smoothstep(.0,.22,min(UV2.y,1.-UV2.y)+(noise-.5)*.055)*.65;
    }
    ALPHA=edge;
}
