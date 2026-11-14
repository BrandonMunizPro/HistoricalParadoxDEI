// Batch readiness fade only. Existing vegetation meshes, textures and placement remain.
instance uniform float scenery_reveal=1.;
float scenery_pixel_threshold(vec2 pixel){return fract(52.9829189*fract(dot(pixel,vec2(.06711056,.00583715))));}
