import {createServer} from 'vite';
import {chromium} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const project=path.resolve(fileURLToPath(new URL('..',import.meta.url))),root=path.resolve(project,'..');
const server=await createServer({root,cacheDir:path.join(project,'.vite-cache'),plugins:[{name:'read-only-comparison-hook',transform(code,id){if(id.replaceAll('\\','/').endsWith('/map/main.js'))return code.replace('const controls = new OrbitControls(camera, renderer.domElement);','const controls = new OrbitControls(camera, renderer.domElement); window.__godotComparison = {camera,controls,renderer};');}}],server:{host:'127.0.0.1',port:4187,strictPort:true}});
await server.listen();
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
const page=await browser.newPage({viewport:{width:1920,height:1080}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4187');await page.waitForFunction(()=>window.__campaignMap?.ready,null,{timeout:120000});
await page.evaluate(()=>{for(const id of ['living-world','research-markers']){const element=document.getElementById(id);if(element){element.checked=false;element.dispatchEvent(new Event('change'));}}});
for(const name of ['overview','sicily','etna','catana']){
const godot=JSON.parse(fs.readFileSync(path.join(project,`evidence/godot-${name}.json`)));
await page.evaluate(({cam})=>{
 window.__campaignMap.focusGeographicForValidation(cam.focus[0],cam.focus[1],cam.distance,false);
 const {camera,controls}=window.__godotComparison;
 camera.clearViewOffset();camera.fov=cam.fov;camera.position.set(...cam.position);
 const offset=camera.position.clone().set(Math.sin(cam.yaw*Math.PI/180)*Math.cos(cam.pitch*Math.PI/180),Math.sin(cam.pitch*Math.PI/180),Math.cos(cam.yaw*Math.PI/180)*Math.cos(cam.pitch*Math.PI/180)).multiplyScalar(cam.distance);
 controls.target.copy(camera.position).sub(offset);controls.enableDamping=false;controls.update();camera.updateProjectionMatrix();
},{cam:godot.camera});
await page.waitForTimeout(3500);
await page.evaluate(()=>window.__campaignMap.frames.length=0);await page.waitForTimeout(2000);
await page.screenshot({path:path.join(project,`evidence/three-${name}.png`)});
const metrics=await page.evaluate(()=>({metrics:window.__campaignMap.metrics,camera:window.__campaignMap.cameraForValidation(),sites:window.__campaignMap.settlements.length,frames:window.__campaignMap.frames}));
const cdp=await browser.newBrowserCDPSession();const processes=(await cdp.send('SystemInfo.getProcessInfo')).processInfo;await cdp.detach();
const ids=processes.map(p=>Number(p.id)).filter(Number.isSafeInteger);
let processMemory=null;
try{processMemory=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-Command',`Get-Process -Id ${ids.join(',')} -ErrorAction SilentlyContinue | Select-Object Id,ProcessName,WorkingSet64 | ConvertTo-Json -Compress`],{windowsHide:true,encoding:'utf8'}));}catch(e){processMemory={unavailable:e.message};}
metrics.processMemory=processMemory;
fs.writeFileSync(path.join(project,`evidence/three-${name}.json`),JSON.stringify({...metrics,errors,viewport:[1920,1080],matching:'Godot camera position/FOV via temporary in-memory Vite instrumentation; no source files modified'},null,2));
console.log('THREE_CAPTURE',name,metrics.sites,metrics.metrics.fps);
}
}finally{await browser.close();await server.close();}
