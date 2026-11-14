shader_type spatial;
render_mode cull_disabled,depth_draw_never;
uniform sampler2D depth_map:hint_depth_texture,filter_nearest,repeat_disable;
uniform sampler2D scene_color:hint_screen_texture,filter_linear_mipmap,repeat_disable;
uniform sampler2D ripple_normal:hint_normal,filter_linear_mipmap_anisotropic,repeat_enable;
uniform float water_time=0.;
varying vec3 world_position;
varying vec2 flow_direction;
void vertex(){world_position=(MODEL_MATRIX*vec4(VERTEX,1.)).xyz;flow_direction=COLOR.rg*2.-1.;}
void fragment(){
 vec2 drift=vec2(0.,water_time*.006);
 vec3 n1=texture(ripple_normal,UV*vec2(.5,.015)-drift).rgb*2.-1.;
 vec3 n2=texture(ripple_normal,UV*vec2(.8,.023)+vec2(.31,-water_time*.004)).rgb*2.-1.;
 vec2 ripple=(n1.xy+n2.xy)*.12;
 vec2 flow=normalize(flow_direction),across=vec2(-flow.y,flow.x);
 vec3 wn=normalize(vec3(across.x*ripple.x+flow.x*ripple.y,1.,across.y*ripple.x+flow.y*ripple.y));
 NORMAL=normalize(mat3(VIEW_MATRIX)*wn);
 // Vulkan reverse-Z reconstruction (Godot 4.3+). Depth is a rendering proxy,
 // including the existing ribbon lift, not surveyed river bathymetry.
 float depth=texture(depth_map,SCREEN_UV).r;
 vec4 behind=INV_PROJECTION_MATRIX*vec4(SCREEN_UV*2.-1.,depth,1.);behind/=behind.w;
 float gap=max(0.,-behind.z+VERTEX.z)*1000.;
 float bank=min(UV.x,1.-UV.x)*45.;
 float transmission=exp(-min(gap,8.)*.65);
 vec3 shallow=vec3(.115,.155,.100),deep=vec3(.025,.085,.075);
 vec3 body=mix(deep,shallow,exp(-bank*.13));
 vec2 refract_uv=clamp(SCREEN_UV+ripple*.001,vec2(.001),vec2(.999));
 vec3 bed=texture(scene_color,refract_uv).rgb;
 ALBEDO=mix(body,bed,transmission*.32);
 ROUGHNESS=.16+(.5+.5*n2.x)*.08;SPECULAR=.5;METALLIC=0.;
 // Standard dielectric sky/ambient reflection and solar specular. No SSR claim.
 ALPHA=smoothstep(0.,2.5,bank)*smoothstep(0.,.45,gap)*.97;
}
