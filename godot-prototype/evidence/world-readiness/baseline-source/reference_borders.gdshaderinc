// Ownership identity, not palette RGB, determines political edges.
uniform sampler2D reference_controller_ids : filter_nearest,repeat_disable;
float reference_controller(vec2 q,bool local,bool sicily){
 vec2 encoded=sicily?texture(reference_sicily_ids,q).rg:(local?texture(reference_local_ids,q).rg:texture(political_boundary_layer,q).rg);
 float region=round(encoded.r*255.)+256.*round(encoded.g*255.);
 vec2 owner=texture(reference_controller_ids,vec2((region+.5)/float(textureSize(reference_controller_ids,0).x),.5)).rg;
 return round(owner.r*255.)+256.*round(owner.g*255.);
}
float reference_edge_sample(vec2 q,vec2 dx,vec2 dy,bool local,bool sicily){
 float c=reference_controller(q,local,sicily);
 return max(max(step(.5,abs(c-reference_controller(q+dx,local,sicily))),step(.5,abs(c-reference_controller(q-dx,local,sicily)))),max(step(.5,abs(c-reference_controller(q+dy,local,sicily))),step(.5,abs(c-reference_controller(q-dy,local,sicily)))));
}
float reference_antialiased_edge(vec2 q,bool local,bool sicily){
 vec2 dx=dFdx(q),dy=dFdy(q);
 return .25*(reference_edge_sample(q+(dx+dy)*.25,dx*.65,dy*.65,local,sicily)+reference_edge_sample(q+(dx-dy)*.25,dx*.65,dy*.65,local,sicily)+reference_edge_sample(q+(-dx+dy)*.25,dx*.65,dy*.65,local,sicily)+reference_edge_sample(q-(dx+dy)*.25,dx*.65,dy*.65,local,sicily));
}
