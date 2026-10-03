'use strict';
const fs=require('fs'), path=require('path');
const OUT='C:\\Users\\brand\\HistoricalGame\\research\\rome2-dei\\extracted';

const manifest=JSON.parse(fs.readFileSync(path.join(OUT,'_manifest.json'),'utf8'));
const args=process.argv.slice(2);
const which=args[0]||'all';

function rowsOf(entry){ const j=JSON.parse(fs.readFileSync(entry.out,'utf8')); return j.rows; }
function fieldsOf(entry){ return JSON.parse(fs.readFileSync(entry.out,'utf8')).fields; }

const byName={};
for(const m of manifest){ if(!m.out) continue; (byName[m.table_name] ||= []).push(m); }

if(which==='all'){
  const names=Object.keys(byName).sort();
  console.log('distinct table names:', names.length);
  for(const n of names){
    const files=byName[n];
    const total=files.reduce((a,f)=>a+f.row_count,0);
    console.log(`  ${n}  files=${files.length}  rows=${total}`);
  }
  process.exit(0);
}

if(which==='name'){
  const n=args[1]; const files=byName[n]||[];
  console.log(`### ${n}: files=${files.length}`);
  for(const f of files) console.log(`  ${f.pack} ${f.path} rows=${f.row_count} ver=${f.version}`);
  const f0=files[0];
  if(f0){
    let f=fieldsOf(f0);
    console.log('fields:', f.join(', '));
    const rs=rowsOf(f0);
    for(let i=0;i<Math.min(2,rs.length);i++) console.log('  row'+i+':', JSON.stringify(rs[i]).slice(0,600));
  }
  process.exit(0);
}

if(which==='values'){
  // distinct values of a column across shards of a table
  const n=args[1], col=args[2];
  const files=byName[n]||[];
  const set=new Set();
  for(const m of files){ try{ for(const r of rowsOf(m)) set.add(JSON.stringify(r[col])); }catch(_){}}
  console.log(`${col} values for ${n}: ${set.size}`);
  for(const v of [...set].slice(0,120)) console.log('  ', v);
  process.exit(0);
}

console.log('Usage: inspect.js all | name <table> | values <table> <col>');
