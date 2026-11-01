import fs from 'node:fs';
const h=new URL('./',import.meta.url);
let s=fs.readFileSync(new URL('../art-direction/compare.mjs',h),'utf8');
s=s.replaceAll('final2-source','final-source').replaceAll('art-before','na-before').replaceAll('art-final2','na-final').replaceAll('navigation-final2','navigation-final').replace('names.length,15','names.length,24');
s=s.replace('15 exactly matched camera pairs: Italy, Greece, Egypt/Nile, Anatolia, Alps.','24 exactly matched camera pairs: Egypt, Delta, Alexandria coast, Eastern Desert, Tunisia, Italy, Sicily and Illyria.').replaceAll('Campaign art direction review','North Africa regional review').replace('Matched art-direction performance','Matched North Africa performance');
s=s.replace('Final tour maximum transition frame 24.0 ms versus 39.2 ms in the pre-budget review tour. The same review capture suite had generation chunks up to 19.0 ms; final chunks max 6.1 ms. These are separate measured samples, not a controlled statistical benchmark. Complete readiness can take longer because smaller CPU slices span more frames (Greece 7.0 -> 9.0 seconds).','See navigation-before/navigation.json for the fresh baseline tour. Timing is a measured sample rather than a statistical benchmark.');
s=s.replace('In particular, Greek strategic GPU time rises from about 3.9 ms to the final value listed above.','The measured table includes all regional changes and baseline views.');
s=s.replace("assert.deepEqual(a.camera,b.camera,'Camera mismatch '+name);","assert.deepEqual(a.camera,b.camera,'Camera mismatch '+name); if(/profile-(italy|sicily|illyria)-/.test(name))assert.deepEqual(a.sceneryComposition,b.sceneryComposition,'Regression baseline composition '+name);");
fs.writeFileSync(new URL('compare.mjs',h),s);
