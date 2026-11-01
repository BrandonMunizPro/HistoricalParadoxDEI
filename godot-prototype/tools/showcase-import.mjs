// Run after Godot's first --editor --import, then import again and bake meshes.
import fs from 'node:fs';
const dir='godot-prototype/assets/roma-showcase';
for(const stem of ['plaster','roof'])for(const map of ['color','normal','roughness']){
 const target=dir+'/'+stem+'-'+map+'.jpg';
 if(!fs.existsSync(target))fs.copyFileSync('godot-prototype/assets/roma/'+stem+'-'+map+'.jpg',target);
}
if(!fs.existsSync(dir+'/gravel-color.jpg'))fs.copyFileSync('godot-prototype/assets/foundation/rocky-ground.jpg',dir+'/gravel-color.jpg');
let count=0;
for(const file of fs.readdirSync(dir))if(/\.(jpg|png)\.import$/.test(file)){
 const path=dir+'/'+file;let text=fs.readFileSync(path,'utf8');
 text=text.replace(/compress\/mode=\d+/,'compress/mode=2').replace('compress/high_quality=false','compress/high_quality=true').replace('mipmaps/generate=false','mipmaps/generate=true');
 if(file.includes('-normal.'))text=text.replace(/compress\/normal_map=\d+/,'compress/normal_map=1');
 fs.writeFileSync(path,text);count++;
}
console.log({configured3DTextures:count,mipmaps:true,gpuCompression:true});
