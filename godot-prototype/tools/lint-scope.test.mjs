import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ESLint} from 'eslint';
test('generated cache is excluded but Godot CLI source errors remain visible',async()=>{
 const eslint=new ESLint({cache:false});
 assert.equal(await eslint.isPathIgnored('godot-prototype/.vite-cache/deps/generated.js'),true);
 assert.equal(await eslint.isPathIgnored('godot-prototype/.godot/generated.js'),true);
 assert.equal(await eslint.isPathIgnored('godot-prototype/tools/visual-report.mjs'),false);
 const [result]=await eslint.lintText('notDeclared();\n',{filePath:'godot-prototype/tools/lint-probe.mjs'});
 assert.ok(result.messages.some(m=>m.ruleId==='no-undef'));
 const [unused]=await eslint.lintText('const unused = 1;\n',{filePath:'godot-prototype/tools/lint-probe.mjs'});
 assert.ok(unused.messages.some(m=>m.ruleId==='@typescript-eslint/no-unused-vars'));
});
