import fs from 'node:fs';
import {PNG} from 'pngjs';
const root='godot-prototype/data/factions';
const data=JSON.parse(fs.readFileSync(root+'/scenario-278.json'));
const image=PNG.sync.read(fs.readFileSync(root+'/territory-ids.png'));
const graph=new Map(data.factions.map(f=>[f.id,new Set()]));
const ids=new Uint16Array(image.width*image.height);
for(let i=0;i<ids.length;i++)ids[i]=image.data[i*4]+256*image.data[i*4+1];
for(let y=0;y<image.height-1;y++)for(let x=0;x<image.width-1;x++){
 const i=y*image.width+x,a=ids[i];if(a<2)continue;
 for(const b of [ids[i+1],ids[i+image.width]])if(b>=2&&a!==b){const fa=data.territories[a-2].initialController,fb=data.territories[b-2].initialController;graph.get(fa).add(fb);graph.get(fb).add(fa);}
}
function hsl(h,s,l){const f=n=>{const k=(n+h/30)%12,a=s*Math.min(l,1-l);return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))))};return '#'+[f(0),f(8),f(4)].map(v=>v.toString(16).padStart(2,'0')).join('');}
function lab(hex){const c=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);const [r,g,b]=c;const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);return [.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s];}
const delta=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const colors={rome:'#a32e3e',carthage:'#713fa2','ptolemaic-egypt':'#c68e18',seleucids:'#2876ae',massylii:'#40762b',masaesyli:'#ad5b25',mauri:'#247a7e',epirus:'#286c4c','macedonian-claimants':'#8d416f',pergamon:'#27877c',rhodes:'#a34831','etruscan-polities':'#98702d',armenia:'#ae593d',atropatene:'#5b7138',pontus:'#72517f',bosporus:'#b58f27',maurya:'#bc6930',kush:'#823e37'};
const candidates=[];
for(let h=0;h<360;h+=7)for(const l of [.26,.33,.40,.46])for(const s of [.45,.58,.68]){const hex=hsl(h,s,l),value=lab(hex);if(value[0]>=.38&&value[0]<=.64&&Math.hypot(value[1],value[2])<=.16)candidates.push({hex,lab:value});}
const remaining=data.factions.filter(f=>!colors[f.id]).sort((a,b)=>graph.get(b.id).size-graph.get(a.id).size||a.id.localeCompare(b.id));
for(const f of remaining){
 const neighbors=[...graph.get(f.id)].filter(id=>colors[id]).map(id=>lab(colors[id]));const used=Object.values(colors).map(lab);let best=null,score=-Infinity;
 for(const c of candidates){if(Object.values(colors).includes(c.hex))continue;const local=neighbors.length?Math.min(...neighbors.map(n=>delta(c.lab,n))):.3;const global=Math.min(...used.map(n=>delta(c.lab,n)));const value=Math.min(local,.32)*4+Math.min(global,.08)-Math.abs(c.lab[0]-.60)*.04;if(value>score){score=value;best=c.hex;}}
 colors[f.id]=best;
}
const sources={
 'roman-wolf':{url:'https://www.britishmuseum.org/collection/object/C_1867-0101-31',title:'British Museum 1867,0101.31, Roman didrachm, 269–266 BCE',evidence:'She-wolf suckling twins on Republican coinage nine or more years after our start. A deliberate near-period game adaptation, not a documented 278 BCE state flag.'},
 'croton-tripod':{url:'https://www.colorado.edu/project/expressionsofidentity/silver-nomos-croton-480-430-bce',title:'University of Colorado, Croton silver nomos, 480–430 BCE',evidence:'Tripod on both sides of Croton coinage, long before the campaign date.'},
 'seleucid-anchor':{url:'https://www.metmuseum.org/art/collection/search/330169',title:'Metropolitan Museum, tetradrachm of Seleucus I, ca. 298–281 BCE',evidence:'Anchor used by Seleucus I and successors; the museum does not assert its meaning.'},
 'carthage-tanit':{url:'https://omeka.uottawa.ca/museumclassicalantiquities/items/show/511',title:'University of Ottawa, Carthaginian Tanit stele, third century BCE',evidence:'Religious motif found at Carthage; not proof of an official state flag or a precise 278 BCE usage date.'},
 'ptolemy-eagle':{url:'https://collections.penn.museum/collections/object/123253',title:'Penn Museum 29-70-509, coin of Ptolemy I',evidence:'Eagle on thunderbolt on a coin attributed to Ptolemy I.'},
 'athens-owl':{url:'https://www.theacropolismuseum.gr/en/node/21907',title:'Acropolis Museum, Athenian tetradrachm, 483–480 BCE',evidence:'Owl and olive twig on Athenian coinage.'},
 'rhodes-rose':{url:'https://www.spurlock.illinois.edu/collections/search-collection/details.php?a=1900.63.0010',title:'Spurlock Museum 1900.63.0010, Rhodian tetradrachm, 304–189 BCE',evidence:'Rose with bud; a documented city motif in a broad dated range that includes the campaign period.'},
 'tarentum-dolphin':{url:'https://www.britishmuseum.org/collection/object/C_RPK-p292M-31-Tar',title:'British Museum RPK,p292M.31.Tar, ca. 280–272 BCE',evidence:'Dolphin rider on Tarentine coinage close to the campaign date.'},
 'numidian-horse':{url:'https://www.siaen.org/documents/10901/11639/2012_256.pdf',title:'Santiago Padrino Fernández, Numisma 256 (2012), pp. 7–28',evidence:'Bearded-head/galloping-horse issues of Massinissa and successors: later than 278 BCE. Applied as regional inspiration, not either tribe’s documented 278 BCE emblem.'},
 'gallic-boar':{url:'https://www.persee.fr/doc/afeaf_1624-6349_1991_num_9_1_1406',title:'Boudet and Moreau, Soulac boar standard, AFEAF 9 (1991)',evidence:'A real Gallic military-standard motif; proposed object date is first century BCE, later than the campaign and not attributable to individual tribes here.'},
};
const attested={rome:['wolf_twins','roman-wolf','later_regional_motif'],croton:['tripod','croton-tripod','attested_motif'],seleucids:['anchor','seleucid-anchor','attested_motif'],carthage:['tanit','carthage-tanit','attested_motif'],'ptolemaic-egypt':['eagle','ptolemy-eagle','attested_motif'],athens:['owl','athens-owl','attested_motif'],rhodes:['rose','rhodes-rose','attested_motif'],tarentum:['dolphin_rider','tarentum-dolphin','attested_motif'],massylii:['horse','numidian-horse','later_regional_motif'],masaesyli:['galloping_horse','numidian-horse','later_regional_motif']};
const laterRegional={aedui:['boar','gallic-boar'],'senones-gaul':['boar_head','gallic-boar'],boii:['boar','gallic-boar']};
const motifs={
 kush:'pyramid',
 main:'incense_altar',saba:'bull',hadramaut:'palm',qataban:'star',nabataea:'camel',lihyan:'ibex',gerrha:'ship',
 bosporus:'grain_ear','achaean-league':'lyre','aetolian-league':'spear',tarentum:'dolphin_rider',rhegion:'lion_head',croton:'tripod',athens:'owl',sparta:'club',messene:'meander',knossos:'labyrinth',gortyn:'bull',syracuse:'triskelion',massalia:'lion',rhodes:'rose',chalcedon:'bull_head','heraclea-pontica':'cornucopia',chersonesos:'deer',byzantion:'bull',
 'scythian-polities':'griffin',yuezhi:'horse_head',dahae:'rider',massagetae:'bow',saka:'stag',
 atropatene:'fire_altar',carthage:'tanit',maurya:'wheel','etruscan-polities':'triskele',
 colchis:'fleece',armenia:'mountain_peak',kartli:'wolf','caucasian-albanian-polities':'crescent',
 'antigonid-holdings':'macedonian_shield',pergamon:'serpent',seleucids:'anchor',epirus:'oak','macedonian-claimants':'star',
 rome:'wolf_twins',bithynia:'thunderbolt',paphlagonia:'spearhead',pontus:'star_crescent','ptolemaic-egypt':'eagle',
 lusitani:'spearhead',vascones:'horse_grazing',carpetani:'horse_head',oretani:'grain_ear',turdetani:'fish',bastetani:'crescent',contestani:'palm',edetani:'lion_head',ilergetes:'rider',indigetes:'sun_disc',
 gallaeci:'torc',astures:'triskele',cantabri:'spear',vaccaei:'grain_ear',vettones:'boar',arevaci:'horse_head',celtiberians:'shield',
 arverni:'boar_charging',aedui:'boar',bituriges:'raven',carnutes:'oak','senones-gaul':'boar_head',parisii:'horse_grazing',remi:'horse_head',nervii:'spear',belgae:'spearhead','armorican-veneti':'ship',aulerci:'torc',pictones:'horse',santones:'grape',aquitani:'bear',volcae:'spearhead',allobroges:'mountain_peak',helvetii:'bear',boii:'boar',insubres:'helmet',cenomani:'horse_lyre',scordisci:'spearhead',taurisci:'ram_head',tectosages:'stag',trocmi:'eagle_stand',tolistobogii:'bird',
 dumnonii:'wheel',durotriges:'horse_head',catuvellauni:'wolf',iceni:'horse',dobunni:'horse_grazing',silures:'shield',ordovices:'spear',brigantes:'horse','caledonian-polities':'stag','hibernian-polities':'torc',
 frisii:'sun_wheel',chauci:'oak',cherusci:'spear',chatti:'axe',suebi:'bear',lugii:'wolf',cimbri:'bull_head','southern-scandinavian-polities':'ship',
 'veneti-italy':'bird','ligurian-polities':'bow',samnites:'shield',lucanians:'bull',bruttians:'wolf',messapians:'horse_head',daunians:'grain_ear',
 ardiaeans:'ship',taulantii:'serpent',dardani:'helmet',liburni:'ship',delmatae:'axe',
 'odrysian-polities':'rider',getae:'snake','dacian-polities':'draco',mauri:'horse',masaesyli:'galloping_horse',massylii:'horse',
 gaetuli:'camel',garamantes:'chariot',nasamones:'sun_disc',marmaridae:'palm',
};
const motifNotes={
 wolf_twins:'Roman she-wolf and twins coinage',pyramid:'Nubian royal pyramid fields',incense_altar:'South Arabian incense altars and trade',bull:'bull cult and Mediterranean bull imagery',bull_head:'Mediterranean bull-head coin imagery',palm:'Arabian frankincense and palm cultivation',star:'ancient star and solar devices',camel:'Arabian and Libyan caravan transport',ibex:'South Arabian ibex reliefs',ship:'Mediterranean and Red Sea shipping',grain_ear:'grain cultivation and Black Sea trade',lyre:'Greek musical and agonistic imagery',spear:'Iron Age warrior equipment',dolphin_rider:'Tarentine dolphin-rider coinage',lion_head:'Mediterranean lion-head coinage',tripod:'Greek tripod dedications',owl:'Athenian owl coinage',club:'Heracles and Peloponnesian cult imagery',meander:'Greek geometric ornament',labyrinth:'Cretan labyrinth tradition',triskelion:'Sicilian triskelion iconography',lion:'Mediterranean lion iconography',rose:'Rhodian rose coinage',cornucopia:'Hellenistic abundance iconography',deer:'Black Sea deer coinage',griffin:'steppe griffin motifs',horse_head:'steppe and Mediterranean horse imagery',rider:'steppe and Thracian horseman imagery',bow:'steppe archery equipment',stag:'steppe and forest stag imagery',fire_altar:'Iranian fire-altar imagery',tanit:'Carthaginian Tanit symbol',wheel:'solar wheel, chariot and Dharmachakra imagery',triskele:'Italic three-legged devices',fleece:'Colchian Golden Fleece tradition',mountain_peak:'Caucasian mountain landscapes',wolf:'Italic and Mediterranean wolf imagery',crescent:'lunar astral imagery',macedonian_shield:'Macedonian shield devices',serpent:'healing and chthonic serpent imagery',anchor:'Seleucid anchor coinage',oak:'sacred oak and Dodona traditions',thunderbolt:'Zeus and thunderbolt imagery',spearhead:'Iron Age spearheads',star_crescent:'Pontic star-and-crescent coinage',eagle:'Ptolemaic eagle coinage',horse_grazing:'Iberian and Celtic horse imagery',fish:'Tartessian and coastal fish imagery',sun_disc:'solar disc imagery',torc:'Celtic torc imagery',shield:'Iron Age shields',boar:'Gallic boar standards',boar_charging:'Gallic boar standards',boar_head:'Gallic boar standards',raven:'Celtic raven iconography',grape:'Mediterranean viticulture',bear:'northern European bear imagery',horse_lyre:'Celtic horse-and-lyre devices',eagle_stand:'Hellenistic eagle standards',bird:'Italian and Celtic bird imagery',horse:'Numidian and Celtic horse imagery',sun_wheel:'northern solar-wheel imagery',axe:'Iron Age axe imagery',draco:'Dacian draco standard',snake:'Danubian serpent imagery',galloping_horse:'Numidian galloping-horse coinage',chariot:'Libyan chariot imagery',helmet:'Iron Age helmet imagery',ram_head:'ram-headed cult imagery',
};
const factions={};
for(const f of data.factions){
 const motif=motifs[f.id];
 if(!motif||!motifNotes[motif])throw new Error('Missing motif assignment for '+f.id);
 let emblem={motif,monogram:f.emblem.monogram,basis:'original_design',sourceKeys:[],note:`Original game device inspired by ${motifNotes[motif]}; no faction-specific 278 BCE emblem is claimed.`};
 if(attested[f.id]){const [m,key,basis]=attested[f.id];emblem={...emblem,motif:m,basis,sourceKeys:[key],note:sources[key].evidence};}
 else if(laterRegional[f.id]){const [m,key]=laterRegional[f.id];emblem={...emblem,motif:m,basis:'later_regional_motif',sourceKeys:[key],note:sources[key].evidence};}
 factions[f.id]={color:colors[f.id],emblem};
}
const edges=[];
for(const [id,ns]of graph)for(const n of ns)if(id<n)edges.push({a:id,b:n,deltaOklab:delta(lab(colors[id]),lab(colors[n]))});
edges.sort((a,b)=>a.deltaOklab-b.deltaOklab);
const output={version:1,notice:'Original redrawn coin/artifact-inspired game devices, not historical national flags. Colors are modern readability choices. Source dates and later regional adaptations are explicit. Territory geometry and controllers are unchanged.',sources,factions,paletteAudit:{method:'Greedy adjacency-aware OKLab separation from unchanged territory-ID raster; curated major colors are fixed. Not a color-vision-deficiency certification.',adjacentPairs:edges.length,minimumAdjacentDelta:edges[0]?.deltaOklab,weakestPairs:edges.slice(0,12)}};
fs.writeFileSync(root+'/presentation.json',JSON.stringify(output,null,2)+'\n');
console.log({entries:Object.keys(factions).length,attested:Object.values(factions).filter(f=>f.emblem.basis==='attested_motif').length,adjacentPairs:edges.length,minimumAdjacentDelta:edges[0]?.deltaOklab});
