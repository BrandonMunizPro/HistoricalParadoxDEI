import fs from 'node:fs';
import assert from 'node:assert/strict';
import {resolveSettlementVisual,visualLayerKeys} from '../../src/presentation/settlement-visual-state.ts';
const base='godot-prototype/data/settlement-visuals/',read=n=>JSON.parse(fs.readFileSync(base+n));
const native=JSON.parse(fs.readFileSync('godot-prototype/evidence/roman-settlement-slice/headless.json'));
assert(native.passed);const policy=read('profiles.json'),fixtures=read('roman-fixtures.json');
fixtures.cases.forEach((fixture,i)=>{const state=resolveSettlementVisual(fixture.input,policy);assert.deepEqual(state,native.states[i],fixture.caseId+' state contract');if(native.layerKeys)assert.deepEqual(visualLayerKeys(state),native.layerKeys[i],fixture.caseId+' layer contract');});
console.log('SETTLEMENT_VISUAL_CONTRACT_OK',fixtures.cases.length);
