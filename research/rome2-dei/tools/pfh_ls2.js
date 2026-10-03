const fs = require('fs');

function parse(file, outList) {
  const fd = fs.openSync(file, 'r');
  const size = fs.fstatSync(fd).size;

  const hdr = Buffer.alloc(32);
  fs.readSync(fd, hdr, 0, 32, 0);
  const magic = hdr.slice(0, 4).toString('ascii');
  const indexType = hdr.readUInt32LE(4);
  const field08 = hdr.readUInt32LE(8);
  const field0c = hdr.readUInt32LE(12);
  const fileCount = hdr.readUInt32LE(16);
  const field14 = hdr.readUInt32LE(20);
  const field18 = hdr.readUInt32LE(24);
  const field1c = hdr.readUInt32LE(28);

  // interleaved index starts at 0x20: [name\0][uint32] * fileCount
  // read a generous window (names avg ~60 bytes); grow if needed
  let cap = Math.min(size - 0x20, Math.max(1 << 20, fileCount * 128));
  let buf = Buffer.alloc(cap);
  fs.readSync(fd, buf, 0, cap, 0x20);

  const entries = [];
  let p = 0;
  for (let i = 0; i < fileCount; i++) {
    if (p >= buf.length) {
      // grow
      cap *= 4;
      const nb = Buffer.alloc(cap);
      fs.readSync(fd, nb, 0, cap, 0x20);
      buf = nb;
    }
    let z = buf.indexOf(0, p);
    if (z < 0) throw new Error('no NUL at entry ' + i);
    const name = buf.slice(p, z).toString('latin1');
    const valOff = z + 1;
    if (valOff + 4 > buf.length) throw new Error('truncated val at entry ' + i);
    const val = buf.readUInt32LE(valOff);
    entries.push({ name, val });
    p = valOff + 4;
  }
  const indexEnd = 0x20 + p;
  fs.closeSync(fd);

  const sum = entries.reduce((a, e) => a + e.val, 0);
  return {
    file, size, magic, indexType, field08, field0c, fileCount,
    field14, field18, field1c, entries, indexEnd, sum,
  };
}

const targets = process.argv.slice(2);
for (let i = 0; i < targets.length; i += 2) {
  const r = parse(targets[i], targets[i + 1]);
  console.log('='.repeat(78));
  console.log('file      :', r.file);
  console.log(`size      : ${r.size}  magic=${r.magic} indexType=${r.indexType}`);
  console.log(`hdr       : [08]=${r.field08} [0c]=${r.field0c} fileCount=${r.fileCount} [14]=${r.field14} [18]=${r.field18} [1c]=${r.field1c}`);
  console.log(`index ends: ${r.indexEnd}   sum(val)=${r.sum}   size-indexEnd=${r.size - r.indexEnd}   match=${r.sum === r.size - r.indexEnd ? 'YES' : 'no'}`);
  console.log('--- first 8 entries (name, val) ---');
  r.entries.slice(0, 8).forEach((e) => console.log(`   ${String(e.val).padStart(10)}  ${e.name}`));
  console.log('--- last 3 entries ---');
  r.entries.slice(-3).forEach((e) => console.log(`   ${String(e.val).padStart(10)}  ${e.name}`));
  if (targets[i + 1]) {
    fs.writeFileSync(targets[i + 1], r.entries.map((e) => e.name + '\t' + e.val).join('\n'));
    console.log('wrote list ->', targets[i + 1]);
  }
}
