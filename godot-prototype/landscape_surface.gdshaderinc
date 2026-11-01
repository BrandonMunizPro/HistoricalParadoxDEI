// Original scoped material implementation. Photographs and measured normal /
// roughness maps are CC0 Poly Haven; provenance in assets/landscape-quality.
uniform bool landscape_enabled=false;
uniform vec4 landscape_rect=vec4(0.0);
uniform sampler2D landscape_control:filter_linear_mipmap,repeat_disable;
uniform sampler2D landscape_meso:source_color,filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D landscape_grass_color:source_color,filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D landscape_grass_normal:hint_normal,filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D landscape_grass_roughness:filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D landscape_soil_color:source_color,filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D landscape_soil_normal:hint_normal,filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D landscape_soil_roughness:filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D landscape_rock_color:source_color,filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D landscape_rock_normal:hint_normal,filter_linear_mipmap_anisotropic,repeat_enable;
uniform sampler2D landscape_rock_roughness:filter_linear_mipmap_anisotropic,repeat_enable;
uniform vec4 landscape_banks[64];
uniform int landscape_bank_count=0;
float landscape_scope(vec2 p){
 vec2 edge=min(p-landscape_rect.xy,landscape_rect.zw-p);
 return landscape_enabled?smoothstep(0.,2.,min(edge.x,edge.y)):0.;
}
float landscape_bank_distance(vec2 p){
 float nearest=100.;
 for(int i=0;i<64;i++){if(i>=landscape_bank_count)break;vec2 a=landscape_banks[i].xy,b=landscape_banks[i].zw,d=b-a;float t=clamp(dot(p-a,d)/max(dot(d,d),.000001),0.,1.);nearest=min(nearest,length(p-a-t*d));}
 return nearest;
}
vec3 landscape_decode_normal(vec2 rg){vec2 xy=rg*2.-1.;return vec3(xy,sqrt(max(.001,1.-dot(xy,xy))));}
void landscape_surface(vec3 position,vec3 n,out vec3 color,out vec3 normal_world,out float roughness){
 vec2 m=position.xz*1000.;
 // Two actual material scales: fine texture fades to a meso photograph as its
 // texels become subpixel. No albedo-derived fake normal or invented relief.
 vec2 g=m/2.,s=m/1.3,r=m/90.;
 vec3 control=texture(landscape_control,(position.xz-landscape_rect.xy)/(landscape_rect.zw-landscape_rect.xy)).rgb;
 vec3 grass=texture(landscape_grass_color,g).rgb;
 // Broad vegetation colour survives minification; this is a colour macro,
 // not a claim that metre-scale grass blades become 90 metres wide.
 mat2 rotation=mat2(vec2(.8,.6),vec2(-.6,.8));
 vec3 meso=mix(texture(landscape_meso,m/90.).rgb,texture(landscape_meso,rotation*m/137.+vec2(.31,.77)).rgb,.5);
 grass=mix(grass,meso,smoothstep(.08,.65,length(fwidth(g)))*.8);
 vec3 soil=texture(landscape_soil_color,s).rgb;
 vec3 weights=pow(abs(n),vec3(4.));weights/=max(dot(weights,vec3(1.)),.001);
 vec3 rock=texture(landscape_rock_color,position.zy*1000./90.).rgb*weights.x+texture(landscape_rock_color,r).rgb*weights.y+texture(landscape_rock_color,position.xy*1000./90.).rgb*weights.z;
 float patch=control.r;
 float slope=1.-clamp(n.y,0.,1.);
 float bank_distance=control.g<.95?landscape_bank_distance(position.xz):100.;
 float bank=(1.-smoothstep(.022,.055,bank_distance));
 float rock_weight=smoothstep(.07,.32,slope)*(.75+control.r*.25);
 float soil_weight=clamp(smoothstep(.42,.76,patch)*.15+bank*.92,0.,1.);
 color=mix(grass,soil,soil_weight);
 color=mix(color,rock,rock_weight);
 color*=mix(.83,1.1,control.b);
 color*=mix(1.,.64,bank*(1.-smoothstep(.020,.035,bank_distance)));
 vec3 gn=landscape_decode_normal(texture(landscape_grass_normal,g).rg);
 vec3 sn=landscape_decode_normal(texture(landscape_soil_normal,s).rg);
 vec3 rn=landscape_decode_normal(texture(landscape_rock_normal,r).rg);
 vec3 detail=normalize(mix(mix(gn,sn,soil_weight),rn,rock_weight));
 float strength=.48*(1.-smoothstep(.15,1.5,length(fwidth(g))));
 // OpenGL +Y normal maps, world-space X/Z basis; robust on non-tangent terrain.
 vec3 t=normalize(vec3(n.y,-n.x,0.)),b=normalize(cross(n,t));
 normal_world=normalize(n+strength*(t*detail.x-b*detail.y));
 roughness=mix(texture(landscape_grass_roughness,g).r,texture(landscape_soil_roughness,s).r,soil_weight);
 roughness=mix(roughness,texture(landscape_rock_roughness,r).r,rock_weight);
 roughness=mix(clamp(roughness,.42,1.),.36,bank*.65);
}
