import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';
const project=path.resolve(fileURLToPath(new URL('..',import.meta.url))),repo=path.dirname(project),run=process.argv[2]??'final';
const folder=path.join(project,'evidence/repair-20261026',run);
const read=p=>JSON.parse(fs.readFileSync(p));
const source=read(path.join(folder,'source.json')),checks=read(path.join(folder,'checks.json'));
assert.equal(checks.sourceRevision,source.sourceRevision);assert.ok(checks.steps.every(s=>s.passed));
const global=read(path.join(folder,'navigation/global-navigation.json')),regional=read(path.join(folder,'navigation/regional-navigation.json'));
assert.ok(global.passed&&regional.passed);assert.equal(global.checks.length,17);assert.equal(regional.checks.length,9);
const negative=read(path.join(folder,'negative-timeout/global-navigation.json'));assert.equal(negative.passed,false);assert.match(negative.failure,/Timed out/);
assert.ok(read(path.join(folder,'water/water.json')).passed);assert.ok(read(path.join(folder,'integrity.json')).passed);
function collect(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?collect(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const metrics=[];let evidenceRecords=0;
for(const file of collect(folder).filter(p=>p.endsWith('.json'))){
 if(file.endsWith('delivery-manifest.json')||file.endsWith('summary.json'))continue;
 const value=read(file);
 if(value.evidence){
  assert.equal(value.evidence.sourceRevision,source.sourceRevision,'Stale evidence: '+file);
  assert.ok(Date.parse(value.evidence.recordedAtUtc)>=Date.parse(source.createdAtUtc)-1000,'Old timestamp: '+file);evidenceRecords++;
 }
 if(!path.basename(file).startsWith('godot-'))continue;
 assert.ok(value.sceneryReadiness.ready);assert.ok(value.residentTiles.length<=13);
 assert.equal(value.sites,35);assert.equal(value.research,687);
 const png=PNG.sync.read(fs.readFileSync(file.replace(/\.json$/,'.png')));assert.equal(png.width,1920);assert.equal(png.height,1080);
 metrics.push({file:path.relative(folder,file).replaceAll('\\','/'),...value});
}
const production=metrics.filter(m=>m.file.startsWith('production/'));
assert.equal(production.length,9);
const presets={...read(path.join(project,'data/production-views.json')),...read(path.join(project,'data/global-views.json'))};
for(const m of production){assert.equal(m.cameraPath,'production');assert.equal(m.camera.distance,presets[m.resolvedProductionView][2]);}
const profiles=metrics.filter(m=>m.file.startsWith('profiles/'));assert.equal(profiles.length,24);
for(const m of profiles){assert.equal(m.cameraPath,'capture-profile');assert.equal(m.resolvedProductionView,'');}
const candidateMetrics=metrics.filter(m=>m.file.startsWith('production/')||m.file.startsWith('profiles/'));
const pairs=[];
for(const name of ['anatolia-overview','anatolia-strategic','zagros-overview','zagros-strategic']){
 const get=prefix=>metrics.find(m=>m.file===`${prefix}/godot-profile-${name}.json`);
 const current=get('profiles'),reference=get('reference'),repeat=get('repeat');assert.ok(current&&reference&&repeat);
 assert.deepEqual(current.camera,reference.camera);assert.deepEqual(current.camera,repeat.camera);
 pairs.push({name,currentFps:1000/current.settledFrameStats.meanMs,referenceFps:1000/reference.settledFrameStats.meanMs,repeatFps:1000/repeat.settledFrameStats.meanMs,currentGpuMs:current.settledGpuStats.meanMs,referenceGpuMs:reference.settledGpuStats.meanMs,repeatGpuMs:repeat.settledGpuStats.meanMs});
}
const approach=metrics.find(m=>m.file==='approach/godot-production-approach.json');assert.ok(approach);assert.equal(approach.cameraPath,'production');assert.equal(approach.resolvedCameraDistanceKm,85);assert.ok(Math.abs(approach.camera.distance-85)<.0001);assert.ok(approach.navigationTrace.maxRelativeDistanceStep<=.080001);
const png=p=>PNG.sync.read(fs.readFileSync(path.join(folder,p)));
const base=png('production/godot-production-campaign.png'),shadow=png('no-shadows/godot-production-campaign.png'),overlap=png('no-overlap/godot-production-campaign.png');
const differences=p=>{let changed=0;for(let y=80;y<150;y++)for(let x=400;x<1600;x++){const i=(y*p.width+x)*4;if(Math.max(...[0,1,2].map(k=>Math.abs(p.data[i+k]-base.data[i+k])))>10)changed++;}return changed;};
const edgeControls={patch:[400,80,1200,70],thresholdPerChannel:10,noShadowChangedPixels:differences(shadow),noOverlapChangedPixels:differences(overlap),notice:'One fixed land join patch; this is not a whole-world seam-free guarantee.'};
const summary={status:'independent-review-pending',accepted:false,sourceRevision:source.sourceRevision,recordedAtUtc:new Date().toISOString(),evidenceRecords,productionViews:production.length,captureProfiles:profiles.length,globalCases:global.checks.length,regionalCases:regional.checks.length,tests:475,negativeTimeoutTest:'expected failure recorded',candidate:{minSettledFps:Math.min(...candidateMetrics.map(m=>1000/m.settledFrameStats.meanMs)),maxSettledFps:Math.max(...candidateMetrics.map(m=>1000/m.settledFrameStats.meanMs)),maxStartupStreamingFrameMs:Math.max(...candidateMetrics.map(m=>m.startupAndStreamingMaxFrameMs)),maxTerrainNodes:Math.max(...candidateMetrics.map(m=>m.residentTiles.length))},pairs,edgeControls,approach:{peakFrameMs:approach.startupAndStreamingMaxFrameMs,river:approach.riverWork,trace:approach.navigationTrace},limitations:['First-use render pipeline stalls remain; no cache-cold guarantee.','Source-resolution and coarse/fine geometry transitions remain.','Diagnostic comparisons are not production navigation presets.']};
fs.writeFileSync(path.join(folder,'summary.json'),JSON.stringify(summary,null,2)+'\n');
const imageFor=m=>m.file.replace(/\.json$/,'.png');
const sections=[['Production navigation',production],['Capture-only zoom inspection',profiles],['Controlled rendering diagnostics',metrics.filter(m=>!candidateMetrics.includes(m))]];
fs.writeFileSync(path.join(folder,'index.html'),`<!doctype html><meta charset="utf-8"><title>Godot repaired checkpoint</title><style>body{background:#152022;color:#e9e1cf;font:16px system-ui;margin:24px}article{margin:28px 0}img{width:min(100%,1200px)}small{color:#bdd1c5}code{overflow-wrap:anywhere}</style><h1>Repaired checkpoint — independent review pending</h1><p>Passing checks do not confer visual acceptance. First-use loading stalls and coarse terrain transitions remain. Production navigation and capture profiles are shown separately.</p><p>Source revision: <code>${source.sourceRevision}</code></p><p><a href="summary.json">Measurements and limitations</a> · <a href="checks.json">Exact commands and exit results</a> · <a href="delivery-manifest.json">Changed files</a></p>${sections.map(([label,rows])=>`<h2>${label}</h2>${rows.map(m=>`<article><h3>${m.view}</h3><small>${m.cameraPath} · ${m.camera.distance} km · ${(1000/m.settledFrameStats.meanMs).toFixed(1)} settled FPS · p95 ${m.settledFrameStats.p95Ms.toFixed(2)} ms · ${m.residentTiles.length} terrain nodes · ${m.sceneryReadiness.instances} scenery instances</small><p><a href="${imageFor(m)}"><img loading="lazy" src="${imageFor(m)}"></a></p></article>`).join('')}`).join('')}`);
const gitWarnings=[];
const git=args=>{
 const result=spawnSync('git',['-c','safe.directory='+repo.replaceAll('\\','/'),...args],{cwd:repo,encoding:'utf8'});
 if(result.status!==0)throw Error(result.stderr||'Git inspection failed');
 if(result.stderr)gitWarnings.push(result.stderr.trim());
 return result.stdout.trim().split(/\r?\n/).filter(Boolean);
};
const modified=git(['diff','--name-only']),added=git(['ls-files','--others','--exclude-standard']);
assert.ok([...modified,...added].every(p=>p.startsWith('godot-prototype/')||p==='eslint.config.js'),'Unexpected file outside authorized repair scope');
const manifestPath=path.relative(repo,path.join(folder,'delivery-manifest.json')).replaceAll('\\','/');
const files=[...new Set([...modified,...added,manifestPath])].sort().map(p=>({path:p,status:modified.includes(p)?'modified':'added',...(p===manifestPath?{sha256:null}:{bytes:fs.statSync(path.join(repo,p)).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(repo,p))).digest('hex')})}));
fs.writeFileSync(path.join(folder,'delivery-manifest.json'),JSON.stringify({status:'independent-review-pending',accepted:false,sourceRevision:source.sourceRevision,baseCommit:source.baseCommit,recordedAtUtc:new Date().toISOString(),authoritativeEvidenceDirectory:path.relative(repo,folder).replaceAll('\\','/'),notice:'Other evidence folders are historical diagnostics, not this review candidate. Ignored engine caches and logs excluded.',gitWarnings,files},null,2)+'\n');
console.log('CHECKPOINT_REPORT_OK',JSON.stringify({productionViews:9,captureProfiles:24,evidenceRecords,sourceRevision:source.sourceRevision}));
