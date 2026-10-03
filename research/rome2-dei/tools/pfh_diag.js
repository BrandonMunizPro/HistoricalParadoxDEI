const fs = require('fs');
const { openPack } = require('./pfh_read.js');

const file = process.argv[2];
const pack = openPack(file);
console.log('size', pack.size, 'dataStart', pack.dataStart, 'entries', pack.entries.length);

const vals = pack.entries.map(e => e.size);
console.log('min', Math.min(...vals), 'max', Math.max(...vals));
console.log('count > 0x40000000:', vals.filter(v => v > 0x40000000).length);

// walk and find first entry whose computed offset exceeds file size
let bad = -1;
for (let i = 0; i < pack.entries.length; i++) {
  if (pack.entries[i].offset + pack.entries[i].size > pack.size) { bad = i; break; }
}
console.log('first entry whose [offset+size] exceeds file size: index', bad);
if (bad >= 0) {
  for (let i = Math.max(0, bad - 4); i <= Math.min(pack.entries.length - 1, bad + 3); i++) {
    const e = pack.entries[i];
    console.log(`  [${i}] off=${e.offset} size=${e.size} end=${e.offset + e.size}  ${e.name}`);
  }
}

// monotonicity of the raw value field
let nonMono = 0, firstNonMono = -1;
for (let i = 1; i < vals.length; i++) if (vals[i] < vals[i - 1]) { nonMono++; if (firstNonMono < 0) firstNonMono = i; }
console.log('non-monotonic steps:', nonMono, 'first at', firstNonMono);

// sample readability at computed offsets
function readable(off, len) {
  if (off + len > pack.size) return null;
  const b = Buffer.alloc(len);
  fs.readSync(pack.fd, b, 0, len, off);
  let pr = 0;
  for (const c of b) if (c === 9 || c === 10 || c === 13 || (c >= 32 && c < 127)) pr++;
  return pr / len;
}
console.log('--- readability samples ---');
for (const frac of [0, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99]) {
  const i = Math.floor(frac * (pack.entries.length - 1));
  const e = pack.entries[i];
  const r = readable(e.offset, Math.min(64, e.size));
  console.log(`  [${String(i).padStart(6)}] off=${String(e.offset).padStart(11)} size=${String(e.size).padStart(10)} printable=${r === null ? 'OOB' : (r * 100).toFixed(0) + '%'}  ${e.name.slice(0, 60)}`);
}
fs.closeSync(pack.fd);
