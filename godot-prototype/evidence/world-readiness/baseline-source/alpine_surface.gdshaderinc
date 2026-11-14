// High-Alpine surface approximation, not a reconstructed 278 BCE glacier map.
uniform bool alpine_detail_enabled=false;
uniform bool alpine_overlay_mesh=false;
uniform sampler2D alpine_source_metres : filter_linear,repeat_disable;
uniform sampler2D alpine_source_normals : filter_linear_mipmap,repeat_disable;
vec2 alpine_uv(vec2 geo){vec2 size=vec2(textureSize(alpine_source_metres,0));return (vec2((geo.x-6.)/10.,(48.-geo.y)/4.)*(size-1.)+.5)/size;}
float alpine_scope(vec2 geo){return smoothstep(0.,.15,min(min(geo.x-6.,16.-geo.x),min(geo.y-44.,48.-geo.y)));}
vec3 alpine_normal(vec2 geo){return normalize(texture(alpine_source_normals,alpine_uv(geo)).rgb*2.-1.);}
float alpine_snow(vec2 geo){
 if(!alpine_detail_enabled)return 0.;
	float weight=alpine_scope(geo);if(weight<=0.)return 0.;
 float height_km=texture(alpine_source_metres,alpine_uv(geo)).r*.001;
 vec3 n=alpine_normal(geo);
 // Static high-elevation snow/firn. North-facing accumulation and exposed rock.
 return weight*smoothstep(2.85,3.45,height_km+clamp(-n.z,-.6,.6)*.30)*(1.-smoothstep(.45,.80,1.-n.y));
}
vec3 alpine_surface_color(vec3 base,vec2 geo){
 if(!alpine_detail_enabled)return base;
 float weight=alpine_scope(geo);if(weight<=0.)return base;
 float height_km=texture(alpine_source_metres,alpine_uv(geo)).r*.001;
 vec3 n=alpine_normal(geo);
 float bare=weight*smoothstep(1.85,2.65,height_km);
 vec3 rock=vec3(.28,.30,.32)*(.70+n.y*.35);
 base=mix(base,rock,bare*.78);
 return mix(base,vec3(.78,.82,.85),alpine_snow(geo)*.94);
}
