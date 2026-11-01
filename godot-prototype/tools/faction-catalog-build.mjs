import fs from 'node:fs';
const root='godot-prototype/data/factions';
const source=JSON.parse(fs.readFileSync(root+'/cliopatria-278-scope.geojson'));
const factions=[],territories=[];
const cultures={roman:['Italic','standard'],italic:['Italic','wreath'],etruscan:['Italic','rosette'],gallic:['Celtic','spiral'],brittonic:['Celtic','spiral'],iberian:['Iberian','sun'],celtiberian:['Celtic','spiral'],germanic:['Germanic','oak'],hellenic:['Hellenic','meander'],hellenistic:['Hellenistic','star'],thracian:['Thracian','horse'],daco_getic:['Dacian / Getic','sun'],illyrian:['Illyrian','ship'],punic:['Punic','tanit'],numidian:['North African','horse'],mauretanian:['North African','horse'],libyan:['North African','sun'],egyptian:['Hellenistic Egyptian','lotus'],nubian:['Nubian','pyramid'],anatolian:['Anatolian','rosette'],iranian:['Iranian','fire'],caucasian:['Caucasian','mountain'],scythian:['Steppe','horse'],arabian:['Arabian','sun'],indian:['Indian','wheel']};
function hsl(h,s,l){const f=n=>{const k=(n+h/30)%12,a=s*Math.min(l,1-l);return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))))};return '#'+[f(0),f(8),f(4)].map(v=>v.toString(16).padStart(2,'0')).join('');}
function add(id,name,culture,label,geometry=null,options={}){
 const faction={id,name,culture,label,color:options.color??hsl((factions.length*137.508+12)%360,.43,.54),emblem:{motif:cultures[culture][1],monogram:options.monogram??name.replace(/[^A-Za-z ]/g,'').split(' ').filter(Boolean).map(w=>w[0]).join('').slice(0,3).toUpperCase()},priority:options.priority??30,viewDistanceKm:options.viewDistanceKm??400,aliases:options.aliases??[],status:options.status??'provisional',notes:options.notes??'Original scenario region based on broadly known regional association. Tribal names/extent may be attested later; not a surveyed 278 BCE border.',sources:options.sources??['dei-factions','rome2-factions'],kind:options.kind??'regional_polity'};
 factions.push(faction);
 if(geometry)territories.push({id:'territory:'+id,initialController:id,geometry,confidence:options.status==='reconstruction'?'source_reconstruction':'scenario_abstraction',priority:options.paintPriority??(options.status==='reconstruction'?100:50),sources:faction.sources,notes:faction.notes});
 return faction;
}
const major={
 'Roman Republic':['rome','Rome','roman',[12.50,41.90],'#b6474c','RM',1100],
 'Carthage':['carthage','Carthage','punic',[10.25,36.70],'#9b79b4','CT',1800],
 'Ptolemaic Kingdom':['ptolemaic-egypt','Ptolemaic Egypt','egyptian',[30.9,27.3],'#d0ad55','PT',2200],
 'Seleucid Empire':['seleucids','Seleucid Empire','hellenistic',[50.7,33.8],'#73a5c9','SL',3400],
 'Maurya Empire':['maurya','Mauryan Empire','indian',[69.2,28.9],'#ba873e','MY',2400],
 'Kingdom of Kush':['kush','Kush','nubian',[33.1,18.4],'#ad775b','KS',1000],
 'Atropatene':['atropatene','Atropatene','iranian',[47.8,37.4],'#8b9a6a','AT',700],
 'Cimmerian Bosporus':['bosporus','Bosporan Kingdom','hellenic',[36.2,45.25],'#b392c4','BS',600],
 'Etruscans':['etruscan-polities','Etruscan Polities','etruscan',[11.4,43.0],'#ad8e65','ET',500],
 'Colchis':['colchis','Colchis','caucasian',[42.3,42.3],'#b3ac66','CL',700],
 'Kingdom of Armenia':['armenia','Orontid Armenia','caucasian',[44.1,39.3],'#ad6c72','AR',900],
 'Antigonid Dynasty':['antigonid-holdings','Antigonid Holdings','hellenistic',[22.95,38.2],'#b58ea8','AG',550],
 'Achaean League':['achaean-league','Achaean League','hellenic',[21.95,38.2],'#8fbfbc','AC',250],
 'Aetolian League':['aetolian-league','Aetolian League','hellenic',[21.6,38.8],'#769f82','AE',300],
 'Kingdom of Bithynia':['bithynia','Bithynia','anatolian',[30.1,40.9],'#cb9673','BT',550],
 'Paphlagonia':['paphlagonia','Paphlagonian Dynasts','anatolian',[33.4,41.2],'#9e9b74','PP',500],
 'Kingdom of Pergamon':['pergamon','Pergamon','hellenistic',[27.25,39.1],'#aa7aac','PG',350],
 'Kingdom of Pontus':['pontus','Pontus','anatolian',[36.0,40.7],'#6da49a','PN',800],
 'Scythia':['scythian-polities','Scythian Polities','scythian',[32.5,48.4],'#a89b68','SC',1700],
 'Yuezhi':['yuezhi','Yuezhi (western extent)','scythian',[74.1,40.3],'#b68776','YZ',1000],
 'Minaeans':['main','Ma’in','arabian',[44.5,16.8],'#8ba7ae','MN',650],
 'Sabaeans':['saba','Saba','arabian',[44.2,15.5],'#b69272','SB',800],
 'Hadhramaut':['hadramaut','Hadramaut','arabian',[49.0,15.8],'#a18bba','HD',1000],
 'Qataban':['qataban','Qataban','arabian',[45.5,15.0],'#8d9a60','QT',500],
};
for(const feature of source.features){
 const m=major[feature.properties.Name];if(!m)continue;
 const faction=add(m[0],m[1],m[2],m[3],feature.geometry,{color:m[4],monogram:m[5],viewDistanceKm:m[6],priority:80,status:'reconstruction',sources:['cliopatria'],notes:`Cliopatria dated polygon ${feature.properties.FromYear} to ${feature.properties.ToYear} inclusive. Scholarly reconstruction, not exact sovereignty; overlaps are disputed. ${m[0]==='antigonid-holdings'?'Greek holdings are not equated with secure Macedonian kingship in 278 BCE.':''}`,kind:m[0].includes('polities')?'polity_group':'polity'});
 faction.sourceRecord={...feature.properties};
}
function zone(id,name,culture,lon,lat,ring,notes,extra={}){
 const coordinates=ring.split(' ').map(p=>p.split(',').map(Number));if(JSON.stringify(coordinates[0])!==JSON.stringify(coordinates.at(-1)))coordinates.push(coordinates[0]);
 return add(id,name,culture,[lon,lat],{type:'Polygon',coordinates:[coordinates]},{notes, ...extra});
}
// Original conservative regional envelopes, not copied game polygons, provinces,
// settlement Voronoi cells, or claims that these tribal borders are attested in 278.
const rows=[
 ['lusitani','Lusitani','iberian',-7.8,39.6,'-9.5,38.3 -8.8,41.2 -7.1,41.5 -6.1,40.3 -6.8,38.4'],
 ['gallaeci','Gallaeci','celtiberian',-8.0,42.7,'-9.6,41.2 -7.1,41.5 -6.4,42.6 -7.0,43.8 -9.5,43.9'],
 ['astures','Astures','celtiberian',-5.9,42.8,'-7.1,41.5 -5.2,41.8 -4.9,43.7 -7.0,43.8 -6.4,42.6'],
 ['cantabri','Cantabri','celtiberian',-4.0,43.0,'-5.2,41.8 -3.3,42.1 -2.8,43.7 -4.9,43.7'],
 ['vascones','Vascones','iberian',-1.7,42.8,'-3.3,42.1 -1.1,41.9 0.0,42.8 -1.8,43.7 -2.8,43.7'],
 ['vaccaei','Vaccaei','celtiberian',-4.8,41.4,'-7.1,41.5 -6.1,40.3 -4.1,40.4 -3.3,42.1 -5.2,41.8'],
 ['vettones','Vettones','celtiberian',-6.0,39.7,'-6.8,38.4 -6.1,40.3 -4.1,40.4 -4.5,38.8'],
 ['arevaci','Arevaci','celtiberian',-2.9,41.4,'-4.1,40.4 -2.0,40.4 -1.1,41.9 -3.3,42.1'],
 ['celtiberians','Celtiberian Confederacies','celtiberian',-1.4,40.8,'-2.0,40.4 -1.0,39.6 0.5,40.3 0.2,41.7 -1.1,41.9'],
 ['carpetani','Carpetani','iberian',-3.7,39.8,'-4.5,38.8 -2.6,38.8 -2.0,40.4 -4.1,40.4'],
 ['oretani','Oretani','iberian',-3.7,38.5,'-5.3,37.6 -3.2,37.5 -2.0,38.4 -2.6,38.8 -4.5,38.8'],
 ['turdetani','Turdetani','iberian',-5.8,37.2,'-7.5,36.6 -5.6,35.9 -4.5,36.5 -3.2,37.5 -5.3,37.6 -6.8,38.4'],
 ['bastetani','Bastetani','iberian',-2.6,37.5,'-4.5,36.5 -2.0,36.7 -1.2,37.5 -2.0,38.4 -3.2,37.5'],
 ['contestani','Contestani','iberian',-0.6,38.4,'-2.0,38.4 -1.2,37.5 0.4,38.4 -0.4,39.2 -1.0,39.6'],
 ['edetani','Edetani','iberian',0.0,39.7,'-1.0,39.6 -0.4,39.2 1.0,39.7 0.9,40.8 0.5,40.3'],
 ['ilergetes','Ilergetes','iberian',0.5,41.5,'0.2,41.7 0.5,40.3 0.9,40.8 2.1,41.3 1.5,42.5 0.0,42.8 -1.1,41.9'],
 ['indigetes','Indigetes','iberian',2.6,42.0,'1.5,42.5 2.1,41.3 3.5,41.5 3.3,42.8'],
 ['arverni','Arverni','gallic',3.0,45.4,'1.5,44.2 3.5,44.2 4.4,45.8 3.5,46.6 1.8,46.3'],
 ['aedui','Aedui','gallic',4.4,46.9,'3.5,46.6 4.4,45.8 5.5,46.2 5.2,47.8 3.7,47.7'],
 ['bituriges','Bituriges','gallic',2.2,47.0,'1.8,46.3 3.5,46.6 3.7,47.7 2.5,48.2 1.3,47.9'],
 ['carnutes','Carnutes','gallic',1.3,48.3,'1.3,47.9 2.5,48.2 2.6,49.1 0.3,49.2 -0.2,48.2'],
 ['senones-gaul','Senones (Gaul)','gallic',3.1,48.2,'2.5,48.2 3.7,47.7 4.6,48.4 3.8,49.2 2.6,49.1'],
 ['parisii','Parisii','gallic',2.5,49.1,'1.4,49.2 2.6,49.1 3.8,49.2 3.0,50.0 1.5,49.9'],
 ['remi','Remi','gallic',4.8,49.6,'3.8,49.2 4.6,48.4 6.3,49.2 5.6,50.4 3.0,50.0'],
 ['nervii','Nervii','gallic',4.0,50.6,'3.0,50.0 5.6,50.4 5.0,51.5 2.3,51.3'],
 ['belgae','Belgae coastal polities','gallic',1.7,50.6,'0.1,49.4 1.5,49.9 3.0,50.0 2.3,51.3 0.2,51.2'],
 ['armorican-veneti','Veneti (Armorica)','gallic',-2.6,47.7,'-4.8,47.4 -2.2,46.8 -1.3,48.1 -2.4,48.7 -5.0,48.6'],
 ['aulerci','Aulerci','gallic',-0.4,48.7,'-2.4,48.7 -1.3,48.1 -0.2,48.2 0.3,49.2 0.1,49.4 -1.8,49.7'],
 ['pictones','Pictones','gallic',-0.5,46.8,'-2.2,46.8 -1.6,45.5 1.0,45.8 1.8,46.3 1.3,47.9 -1.3,48.1'],
 ['santones','Santones','gallic',-0.5,45.6,'-1.6,45.5 -1.5,44.8 1.5,44.2 1.8,46.3 1.0,45.8'],
 ['aquitani','Aquitanian polities','gallic',-0.3,44.2,'-1.8,43.1 0.0,42.8 2.0,43.0 1.5,44.2 -1.5,44.8'],
 ['volcae','Volcae','gallic',2.7,43.8,'2.0,43.0 4.3,43.2 4.8,44.7 3.5,44.2 1.5,44.2'],
 ['allobroges','Allobroges','gallic',5.9,45.6,'4.8,44.7 6.5,44.7 7.1,46.3 5.5,46.2 4.4,45.8'],
 ['helvetii','Helvetii','gallic',7.7,47.0,'6.5,46.2 8.8,46.4 9.3,47.7 7.2,48.1 5.2,47.8 5.5,46.2'],
 ['dumnonii','Dumnonii','brittonic',-4.0,50.8,'-6.0,50.0 -3.0,50.1 -2.5,51.2 -4.2,51.5 -5.5,51.3'],
 ['durotriges','Durotriges','brittonic',-2.1,50.9,'-3.0,50.1 -0.8,50.3 -1.4,51.5 -2.5,51.2'],
 ['catuvellauni','Catuvellauni','brittonic',-0.3,51.7,'-1.4,51.5 -0.8,50.3 1.7,50.8 1.4,52.2 -0.2,52.8 -1.7,52.3'],
 ['iceni','Iceni','brittonic',0.9,52.6,'1.4,52.2 2.0,52.0 1.7,53.3 -0.2,53.1 -0.2,52.8'],
 ['dobunni','Dobunni','brittonic',-2.2,52.0,'-2.5,51.2 -1.4,51.5 -1.7,52.3 -2.8,52.9 -3.0,52.0'],
 ['silures','Silures','brittonic',-3.6,51.8,'-5.5,51.3 -4.2,51.5 -3.0,52.0 -2.8,52.9 -4.5,52.8 -5.4,52.0'],
 ['ordovices','Ordovices','brittonic',-3.8,53.1,'-4.5,52.8 -2.8,52.9 -2.8,53.5 -4.6,53.6 -5.2,53.2'],
 ['brigantes','Brigantes','brittonic',-1.9,54.3,'-2.8,53.5 -0.2,53.1 0.3,54.0 -1.3,55.5 -3.3,55.3 -3.5,54.2'],
 ['caledonian-polities','Caledonian polities','brittonic',-4.0,57.3,'-5.8,55.3 -3.3,55.3 -1.3,55.5 -1.8,57.7 -3.3,59.6 -6.5,58.6 -6.6,56.5'],
 ['hibernian-polities','Hibernian polities','brittonic',-8.0,53.2,'-10.8,51.3 -6.0,51.5 -5.5,54.3 -7.2,55.6 -10.7,54.7'],
 ['frisii','Frisii','germanic',6.1,53.3,'4.2,51.4 6.0,51.4 7.4,52.5 7.0,54.0 5.5,54.0'],
 ['chauci','Chauci','germanic',8.3,53.4,'7.4,52.5 9.5,52.4 9.7,54.3 7.0,54.0'],
 ['cherusci','Cherusci','germanic',9.4,51.9,'7.0,50.3 9.6,50.7 10.7,52.4 9.5,52.4 7.4,52.5'],
 ['chatti','Chatti','germanic',8.6,50.4,'6.3,49.2 8.6,49.3 9.6,50.7 7.0,50.3 5.6,50.4'],
 ['suebi','Suebi polities','germanic',12.2,51.9,'9.6,50.7 12.0,49.7 14.6,50.6 15.2,53.8 11.0,54.4 9.5,52.4 10.7,52.4'],
 ['lugii','Lugii','germanic',17.1,51.6,'14.6,50.6 17.0,49.8 20.4,51.0 20.0,53.4 15.2,53.8'],
 ['cimbri','Cimbri','germanic',9.2,56.4,'8.0,54.0 11.0,54.4 11.1,57.9 8.1,57.4'],
 ['southern-scandinavian-polities','Southern Scandinavian polities','germanic',13.3,57.5,'11.1,54.6 16.9,55.3 18.5,59.5 15.0,61.5 10.5,59.5'],
 ['boii','Boii','gallic',11.2,44.5,'9.4,44.3 10.4,43.8 12.6,43.9 12.6,45.0 11.0,45.1'],
 ['insubres','Insubres','gallic',9.0,45.4,'7.2,44.7 9.4,44.3 11.0,45.1 10.4,46.3 8.1,46.3'],
 ['cenomani','Cenomani','gallic',10.8,45.6,'10.4,46.3 11.0,45.1 12.6,45.0 12.5,46.3'],
 ['veneti-italy','Veneti (Adriatic)','italic',12.8,45.7,'12.6,45.0 13.8,45.4 13.7,46.5 12.5,46.3'],
 ['ligurian-polities','Ligurian polities','italic',8.0,44.1,'6.6,43.5 8.2,43.7 9.4,44.3 7.2,44.7 6.5,44.7'],
 ['samnites','Samnite polities','italic',14.5,41.5,'13.3,41.5 14.2,40.8 15.5,41.3 15.2,42.2 14.0,42.3'],
 ['lucanians','Lucanians','italic',16.0,40.2,'15.2,39.6 16.5,39.7 16.9,40.5 15.5,41.3 14.7,40.5'],
 ['bruttians','Bruttians','italic',16.2,39.2,'15.6,37.9 16.6,38.1 17.2,39.5 16.5,39.7 15.2,39.6'],
 ['messapians','Messapians','italic',18.0,40.1,'17.4,39.6 18.7,39.7 18.6,40.6 17.8,40.8 17.2,40.4'],
 ['daunians','Daunians','italic',15.8,41.7,'15.2,42.2 16.5,42.1 16.6,41.4 15.5,41.3'],
 ['tarentum','Tarentum','hellenic',17.25,40.45,'16.7,40.1 17.4,40.1 17.8,40.8 16.9,40.9'],
 ['rhegion','Rhegion','hellenic',15.65,38.12,'15.4,37.9 15.9,37.9 16.0,38.3 15.5,38.4'],
 ['croton','Croton','hellenic',17.1,39.1,'16.7,38.7 17.5,38.7 17.4,39.6 16.9,39.5'],
 ['epirus','Epirus','hellenistic',20.65,39.65,'19.7,39.3 20.6,38.7 21.4,39.2 21.6,40.5 20.0,40.7'],
 ['macedonian-claimants','Macedon (contested)','hellenistic',22.5,40.75,'20.5,40.6 21.5,39.5 23.3,39.8 24.6,40.8 23.6,41.6 21.3,41.6'],
 ['athens','Athens','hellenic',23.7,37.95,'23.0,37.7 24.2,37.5 24.2,38.4 23.4,38.5'],
 ['sparta','Sparta','hellenic',22.5,37.0,'22.1,36.4 23.3,36.3 23.3,37.3 22.3,37.4'],
 ['messene','Messene','hellenic',21.9,37.2,'21.2,36.7 22.1,36.4 22.3,37.4 21.5,37.8'],
 ['knossos','Knossos','hellenic',25.15,35.3,'24.8,35.0 25.5,35.0 25.8,35.6 24.8,35.6'],
 ['gortyn','Gortyn','hellenic',24.95,35.05,'24.4,34.8 25.6,34.8 25.5,35.0 24.8,35.2'],
 ['ardiaeans','Ardiaei','illyrian',18.9,42.7,'16.9,42.2 18.7,41.7 20.2,42.2 19.9,43.5 18.0,44.0'],
 ['taulantii','Taulantii','illyrian',19.6,41.3,'18.7,41.7 19.5,40.5 20.5,40.6 20.2,42.2'],
 ['dardani','Dardani','illyrian',21.1,42.6,'20.2,42.2 21.3,41.6 22.6,42.0 22.1,43.5 19.9,43.5'],
 ['liburni','Liburni','illyrian',15.1,44.5,'13.7,44.0 15.8,43.4 16.9,44.5 15.9,45.5 13.8,45.4'],
 ['delmatae','Delmatae','illyrian',17.0,43.7,'15.8,43.4 16.9,42.2 18.0,44.0 16.9,44.5'],
 ['odrysian-polities','Odrysian polities','thracian',25.7,42.0,'24.6,40.8 27.8,41.4 28.3,43.0 26.0,43.5 23.6,41.6'],
 ['getae','Getae','daco_getic',26.9,44.8,'25.0,43.5 28.3,43.0 29.8,45.2 28.0,46.0 25.3,45.3'],
 ['dacian-polities','Dacian polities','daco_getic',23.8,46.1,'21.4,44.9 25.3,45.3 28.0,46.0 26.2,48.2 22.0,48.0'],
 ['scordisci','Scordisci','gallic',20.1,44.6,'18.0,44.0 19.9,43.5 22.1,43.5 21.4,44.9 20.0,46.0 17.0,45.6'],
 ['taurisci','Taurisci','gallic',14.8,47.0,'12.5,46.3 15.9,45.5 17.0,45.6 17.0,47.6 14.5,48.3 12.5,48.0'],
 ['mauri','Mauri','mauretanian',-5.8,34.0,'-9.5,30.7 -7.8,34.8 -5.0,35.9 -2.2,35.1 -2.3,32.1 -6.5,30.0'],
 ['masaesyli','Masaesyli','numidian',2.4,35.1,'-2.3,32.1 -2.2,35.1 0.3,36.7 5.3,36.7 6.7,36.9 6.2,33.7 2.0,32.4'],
 ['massylii','Massylii','numidian',7.5,35.4,'6.7,36.9 9.1,36.8 9.3,34.0 6.2,33.7'],
 ['gaetuli','Gaetulian polities','libyan',1.0,31.7,'-6.5,30.0 -2.3,32.1 2.0,32.4 6.2,33.7 9.3,34.0 8.0,30.0 1.0,29.0'],
 ['garamantes','Garamantes','libyan',13.1,27.5,'10.5,25.4 15.1,25.6 16.5,28.7 14.0,30.2 10.8,29.0'],
 ['nasamones','Nasamones','libyan',20.0,29.7,'16.5,28.7 20.7,28.4 23.0,31.5 19.7,32.1 16.7,31.1'],
 ['marmaridae','Marmaric polities','libyan',25.0,30.0,'23.0,31.5 20.7,28.4 26.1,27.4 28.7,30.6 26.8,31.8'],
 ['nabataea','Nabataea','arabian',36.4,29.7,'34.4,28.0 36.4,27.0 39.0,29.0 38.3,32.1 35.0,31.5'],
 ['lihyan','Lihyan','arabian',37.6,26.6,'35.1,24.2 38.8,23.9 39.1,26.8 36.4,27.0'],
 ['gerrha','Gerrha','arabian',49.4,26.0,'47.8,24.4 50.8,24.6 51.6,27.0 49.1,27.5'],
 ['kartli','Kartli (Iberia)','caucasian',44.5,42.0,'43.5,41.5 45.7,41.0 46.3,42.5 44.9,43.3 43.5,42.7'],
 ['caucasian-albanian-polities','Caucasian Albanian polities','caucasian',47.6,41.5,'45.7,41.0 48.5,39.8 50.0,40.5 49.1,42.6 46.3,42.5'],
 ['dahae','Dahae','scythian',56.2,40.9,'52.6,38.9 57.1,38.3 59.5,40.8 57.9,43.7 53.0,43.0'],
 ['massagetae','Massagetae','scythian',61.0,44.8,'57.9,43.7 59.5,40.8 65.0,42.0 66.8,45.0 62.5,47.8 58.0,47.0'],
 ['saka','Saka polities','scythian',69.3,43.0,'65.0,42.0 67.2,38.6 73.9,38.0 75.0,43.0 72.1,47.7 66.8,45.0'],
];
for(const [id,name,culture,x,y,ring] of rows){
 const notes=id==='macedonian-claimants'?'Macedonian kingship was unstable after the Gallic invasion. Original contested scenario envelope, not secure Antigonid sovereignty.':id==='epirus'?'Pyrrhus is active in Italy and enters Sicily during 278 BCE. Home territory is an original approximate reconstruction; campaigns do not automatically annex allies.':undefined;
 zone(id,name,culture,x,y,ring,notes,{sources:id==='epirus'||id==='macedonian-claimants'?['attalus-278','cliopatria']:['dei-factions','rome2-factions'],kind:name.includes('polities')?'polity_group':'regional_polity'});
}
// Identifiable disjoint members of the source Greek-city aggregate, not one
// fictitious pan-Hellenic state. No nearest-settlement partitioning is used.
const greek=source.features.find(f=>f.properties.Name==='Greek City-States');
for(const [component,id,name,label] of [[3,'syracuse','Syracuse',[15.05,37.05]],[11,'massalia','Massaliote Cities',[5.3,43.3]],[12,'rhodes','Rhodes',[28.0,36.2]],[15,'chalcedon','Chalcedon',[29.1,41.1]],[16,'heraclea-pontica','Heraclea Pontica',[31.55,41.3]],[18,'chersonesos','Chersonesos',[33.8,44.8]]]){
 add(id,name,'hellenic',label,{type:'Polygon',coordinates:greek.geometry.coordinates[component]},{status:'reconstruction',sources:['cliopatria'],priority:55,notes:'Identified disjoint component of Cliopatria’s Greek City-States aggregate. Chora/city-network approximation, not exact urban sovereignty.'});
}
zone('byzantion','Byzantion','hellenic',28.98,41.02,'28.5,40.9 29.0,40.9 29.15,41.2 28.6,41.5','Original approximate Byzantine chora envelope on the European Bosporus; distinguish from the Asian Chalcedonian source component.',{sources:['dei-factions','cliopatria']});
for(const [id,name,label] of [['tectosages','Tectosages',[29.2,40.0]],['trocmi','Trocmi',[29.8,39.8]],['tolistobogii','Tolistobogii',[28.6,40.0]]])add(id,name,'gallic',label,null,{status:'presence_only',sources:['oxford-galatia','attalus-278'],notes:'Galatian arrivals cross into Anatolia in 278 BCE; later fixed Galatian territories are not projected backward. Marker is an approximate regional arrival location, not a new settlement.',kind:'migrating_group'});
factions.find(f=>f.id==='massylii').aliases=['Massylians','Massylian','Massyli'];
factions.find(f=>f.id==='carthage').aliases=['Kart Hadasht','Qart Hadasht','Carthaginian'];
factions.find(f=>f.id==='rome').aliases=['Roman Republic','Roma'];
const sources={cliopatria:{url:'https://github.com/Seshat-Global-History-Databank/cliopatria',revision:'5f433377139a6eeaeacbdc894b70f8805b72c8b5',license:'CC-BY-4.0',citation:'Bennett et al. (2025), Cliopatria, Scientific Data 12:247, DOI 10.1038/s41597-025-04516-9. Dated -278 inclusive subset; selected components/relabeling noted.',licenseUrl:'https://creativecommons.org/licenses/by/4.0/'},'dei-factions':{url:'https://divideetimperamod.com/factions/',role:'Reference roster/regional associations only; no copied artwork, game geometry or code.'},'rome2-factions':{url:'https://wiki.totalwar.com/w/Factions',role:'Official faction families and presentation reference; 272 BCE is not our date.'},'attalus-278':{url:'https://www.attalus.org/bc3/year278.html',role:'278 BCE chronology with ancient source references.'},'oxford-galatia':{url:'https://academic.oup.com/edited-volume/61673/chapter-abstract/548936586',role:'278 BCE crossing and later territorial settlement; guards against anachronistic fixed Galatia.'},'imperator-reference':{url:'https://imperator.paradoxwikis.com/Countries',role:'Faction granularity/presentation reference; 304 BCE is not copied as 278 BCE.'},'numidia':{url:'https://www.worldhistory.org/article/1196/the-masaesyli-and-massylii-of-numidia/',role:'Numidian regional identities; exact 278 extent remains a scenario abstraction.'},'iranica-bactria':{url:'https://www.iranicaonline.org/articles/bactria/bactria-i-pre-islamic-period/',role:'Bactria/Parthia secession is later than this scenario; no independent kingdoms invented.'}};
for(const id of ['massylii','masaesyli']){const f=factions.find(f=>f.id===id);f.sources.push('numidia');const t=territories.find(t=>t.initialController===id);t.sources=f.sources;}
const data={version:1,dateBce:278,scope:{west:-12,east:75,south:12,north:62},notice:'Original game scenario cartography: sourced reconstruction mixed with openly provisional regional/tribal abstractions. Neither exact 278 BCE borders nor copied Rome II/Imperator territories. Original emblems are game symbols, not attested national flags. Unknown land stays neutral. Galatian arrivals have markers only; Bactria and Parthia remain within the Seleucid source extent.',cultures:Object.entries(cultures).map(([id,[family,motif]])=>({id,family,motif})),sources,factions,territories};
fs.writeFileSync(root+'/scenario-278.json',JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({factions:factions.length,territories:territories.length,sourced:territories.filter(t=>t.confidence==='source_reconstruction').length,presenceOnly:factions.filter(f=>f.status==='presence_only').length}));
