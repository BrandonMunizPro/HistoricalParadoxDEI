import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='godot-prototype/evidence/world-readiness/';
const names=['before-cold','before-warm','after-cold','after-warm'];
const reports=Object.fromEntries(names.map(name=>{const p=JSON.parse(fs.readFileSync(root+name+'/profile.json'));assert.deepEqual(p.viewportSize,[1280,720]);assert.equal(p.routes.length,6);assert(fs.readFileSync(root+name+'.log','utf8').includes('WORLD_READINESS_PROFILE_DONE'));return [name,p];}));
const gib=n=>(n/1024**3).toFixed(2),seconds=n=>(n/1000).toFixed(2);
let text='# Native measurements\n\nGodot 4.7.2, Vulkan Forward+, NVIDIA GeForce RTX 3060 Laptop GPU, 1280×720. Startup is measured from campaign scene loading to retirement of its loading cover; engine process initialization is excluded. Eight-second navigation windows; PNG readbacks excluded. Single sequential runs. Cold = fresh placement-cache namespace; OS/driver caches were not flushed.\n\n';
text+='| Run | Startup to map (s) | Peak reported video allocation (GiB) | Peak tracked static memory (GiB) |\n|---|---:|---:|---:|\n';
for(const name of names){const p=reports[name];text+=`| ${name} | ${seconds(p.startupMs)} | ${gib(Math.max(...p.routes.map(r=>r.videoBytes)))} | ${gib(Math.max(...p.routes.map(r=>r.staticBytes)))} |\n`;}
text+='\n| Route | Before warm mean / p99 (ms) | After warm mean / p99 (ms) | Before detail ready (s) | After detail ready (s) | Baseline on first arrival |\n|---|---:|---:|---:|---:|---|\n';
for(let i=0;i<6;i++){const a=reports['before-warm'].routes[i],b=reports['after-warm'].routes[i];assert.equal(a.name,b.name);text+=`| ${a.name}${i===5?' (repeat)':''} | ${a.frames.meanMs.toFixed(2)} / ${a.frames.p99Ms.toFixed(2)} | ${b.frames.meanMs.toFixed(2)} / ${b.frames.p99Ms.toFixed(2)} | ${a.coastReadyMs<0?'>8':seconds(a.coastReadyMs)} | ${b.coastReadyMs<0?'>8':seconds(b.coastReadyMs)} | ${b.arrival.baseline?'Available':'Missing'} |\n`;}
text+='\nDetail-ready times describe the optional detailed beach/compute patch, not a wait for basic coastline geometry. The repeated Delta visit exercises the patch cache. Baseline readiness flags alone do not prove visual correctness; inspect the first-draw screenshots. No general frame-rate improvement is claimed.\n';
text+=`\nOn the repeated Delta visit, the largest recorded frame interval was ${reports['before-warm'].routes[5].frames.maxMs.toFixed(2)} ms before and ${reports['after-warm'].routes[5].frames.maxMs.toFixed(2)} ms after. This is a single-run observation, not attribution of every stall to coast generation.\n`;
const visual=JSON.parse(fs.readFileSync(root+'immediate/validation.json'));
text+=`\nNative first-draw/zoom assertions: ${visual.checks} checks; passed=${visual.passed}. Visual inspection is documented separately in REPORT.md.\n`;
fs.mkdirSync('docs/world-readiness',{recursive:true});fs.writeFileSync('docs/world-readiness/MEASUREMENTS.md',text);
console.log('WORLD_READINESS_REPORT_WRITTEN');
