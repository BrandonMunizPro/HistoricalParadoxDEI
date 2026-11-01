shader_type spatial;
render_mode cull_disabled;
uniform float water_time=0.0;
uniform float river_roughness=.21;
uniform float river_specular=.65;
uniform float bank_fraction=.10;
varying vec3 world_pos;
void vertex(){world_pos=VERTEX;}
void fragment(){
 float edge=min(UV.x,1.0-UV.x);
 float bank=1.0-smoothstep(.0,bank_fraction,edge);
 float long_phase=world_pos.x*28.0+world_pos.z*19.0-water_time*.55;
 // Analytic ripples need the same screen-space band limit as texture mipmaps.
 // Leave resolved close waves intact; remove subpixel stripes on large lakes.
 float long_filter=1.0-smoothstep(1.0,3.0,fwidth(long_phase));
 float ripple_filter=1.0-smoothstep(1.0,3.0,fwidth(world_pos.z*97.0)+fwidth(world_pos.x*53.0));
 float long_wave=sin(long_phase)*long_filter;
 float ripple=sin(world_pos.z*97.0+sin(world_pos.x*53.0)-water_time*.83)*ripple_filter;
 vec3 surface_normal=normalize(vec3(long_wave*.045+ripple*.014,1.0,ripple*.032));
 NORMAL=normalize(mat3(VIEW_MATRIX)*surface_normal);
 float fresnel=pow(1.0-clamp(dot(NORMAL,VIEW),0.0,1.0),4.0);
 vec3 water=mix(vec3(.008,.043,.055),vec3(.019,.092,.105),.45+long_wave*.12+ripple*.04);
 ALBEDO=mix(water,vec3(.105,.16,.105),bank*.65);
 // Restrained original sky reflection cue; no SSR, depth copy or bathymetry.
 EMISSION=mix(vec3(.006,.025,.032),vec3(.12,.23,.29),fresnel*.32)*(1.0-bank*.65);
 ROUGHNESS=mix(river_roughness,.72,bank);
 SPECULAR=mix(river_specular,.13,bank);
}
