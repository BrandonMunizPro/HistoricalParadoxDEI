// Surf on the actual ocean surface, avoiding a second surface hiding beneath
// displaced waves. Rock impact remains outside land; banks stay much calmer.
float contact_noise(vec2 p){
 vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 vec4 q=fract(sin(vec4(dot(i,vec2(127.1,311.7)),dot(i+vec2(1,0),vec2(127.1,311.7)),dot(i+vec2(0,1),vec2(127.1,311.7)),dot(i+vec2(1,1),vec2(127.1,311.7))))*43758.5453);
 return mix(mix(q.x,q.y,f.x),mix(q.z,q.w,f.x),f.y);
}
float campaign_coast_foam(vec2 position,float time){
 if(!focus_coast_streamed||focus_coast_weight(position)<.999)return 0.;
 vec2 size=vec2(textureSize(focus_coast_distance,0));vec4 coast=texture(focus_coast_distance,(focus_coast_uv(position)*(size-1.)+.5)/size);
 float offshore=-coast.r*1000.;if(offshore<0.||offshore>180.)return 0.;
 // Limit hash domains before fine sampling to retain precision on long coasts.
 float exposure=coast.g<0.?.15:1.;
 float along=mod(abs(coast.g)*1000.,4096.);
 float lace=contact_noise(vec2(along*.12,offshore*.25)+vec2(time*.04,time*.13));
 float bubbles=contact_noise(vec2(along*.37,offshore*.78)-vec2(0.,time*.2));
 float phase=sqrt(offshore+12.)*2.6+time*.86+(contact_noise(vec2(along*.035,time*.07))-.5)*2.8;
 float breaker=pow(max(0.,cos(phase)),5.)*smoothstep(1.,8.,offshore)*(1.-smoothstep(65.,160.,offshore));
 float trail=pow(max(0.,cos(phase-.65)),3.)*.27;
 float beach=(breaker+trail)*smoothstep(.38,.73,lace+bubbles*.2)*coast.b*(1.-smoothstep(140.,180.,offshore));
 float impact=(1.-smoothstep(2.,mix(7.,20.,coast.a),offshore))*pow(.5+.5*sin(time*1.08+along*.012+lace*3.),2.);
 impact*=mix(.16,.8,coast.a)*(1.-coast.b)*smoothstep(.22,.7,lace+bubbles*.2);
 return clamp(beach*exposure+impact*mix(.4,1.,exposure),0.,1.);
}
