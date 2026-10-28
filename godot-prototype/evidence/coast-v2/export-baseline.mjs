import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
for(const [src,dst] of [['water.gdshader','before-water.gdshader'],['terrain.gdshader','before-terrain.gdshader'],['data/visual-settings.json','before-settings.json']]){
 fs.writeFileSync(new URL(dst,import.meta.url),execFileSync('git',['show','cbab459:godot-prototype/'+src]));
}
