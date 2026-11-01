# Rome II / DEI / Medieval Kingdoms reference study

Research date: 28 October 2026. This study distinguishes documented mechanics,
direct image observations and our own design proposals. No reference game's
mesh, texture, source code, building-card artwork or exact building design was
imported into the game.

## Confirmed mechanics and what we change

| Topic | Confirmed reference behavior | Our adaptation / deliberate difference |
|---|---|---|
| Major/minor | The [official Rome II building browser](https://r2encv2.totalwar.com/en/buildings/index.html) separates provincial-capital, minor-settlement, port and development chains. | Fixed configurable capacities of six and four; no universal category-to-slot arrangement. |
| Slots | [Total War Academy](https://academy.totalwar.com/rome-2-province-overview/) describes population surplus unlocking slots and unfilled expansion becoming slums. | Slots are supplied by class. Empty slots remain available; no population growth, slums or economy simulation. |
| Stages | The browser displays branching chains with levels extending beyond III. | Exactly three readable visual stages; maximum stage and scenario starting stage are separate. |
| Categories | The browser distinguishes military, industry, agriculture, religion and city-centre functions; resource/technology requirements gate some choices. | Shared effect interfaces plus differentiated architectural families; entertainment and extraction are explicit categories. |
| DEI resources | [DEI's resource documentation](https://divideetimperamod.com/resources/) connects resource regions, specialized construction and trade/conquest access. Some chains spread selected resources. | Extraction requires evidenced deposits and terrain. No invented deposit or resource economy is added to either demonstration site. |
| DEI development | [DEI's population guide](https://divideetimperamod.com/population/) documents building modifiers to population classes and growth conditions. | Named future food/order/wealth/trade/recruitment/culture/development hooks, with null magnitudes. No demographics or full economy. |
| Version changes | [Official Patch 15 notes](https://wiki.totalwar.com/w/Total_War_ROME_II%3A_Patch_15.html) describe revised capital/minor branches and changes to port/religious chains. | Do not present a single browser/version as a universal rule across release, Emperor Edition, DLC and DEI. |
| Unique capitals | [CA's capital-city presentation](https://wiki.totalwar.com/w/Capital_Cities_(TWR2).html) identifies bespoke **battle maps** for Rome, Athens, Alexandria, Carthage and Babylon. | Roma has an original composition and Forum landmark. We do not infer a unique campaign mesh for every chain level from battle-map screenshots. |
| Medieval Kingdoms | [MK1212's Western Map Pack author](https://steamcommunity.com/sharedfiles/filedetails/?id=2782762276) explicitly describes custom/multiplayer maps, asset-production limits and narrow streets; that pack is not a working campaign-map replacement. | Learn from coherent street fronts and planned art production, rather than claim that its battle artwork demonstrates automatic campaign development. |

The official browser's HTML offers Roman, Hellenistic, Barbarian and Eastern
groups. This is not proof of ten unique mesh libraries. The official
[Village entry](https://r2encv2.totalwar.com/en/building/barb_town_2rom_Barbarian/)
lists Celtic, Suebi, Getae, Odrysian and Ardiaei availability on a shared chain.
Shared definitions establish neither identical nor unique 3D models. Our finer
cultural families are an intentional design choice, not a claim that Rome II
uses the same taxonomy internally.

## Visual references actually inspected

1. [Rome campaign screenshot, Steam user Dark Redslayer](https://steamcommunity.com/sharedfiles/filedetails/?id=853140427).
   Observations: packed pale wall masses, tiled roof variation, an instantly
   recognizable open oval landmark, continuous walls and varied frontage
   heights. The source's mod/version state is not independently verified.
   It is one appearance example, not a controlled before/after progression.
2. [Official Rome II store gallery](https://store.steampowered.com/app/214950/Total_War_ROME_II__Emperor_Edition/),
   [Alexandria/Memphis image](https://cdn.cloudflare.steamstatic.com/steam/apps/214950/ss_4ac768c0ccdebf0b0ba8b19f662b1c6c92bfce63.1920x1080.jpg).
   Observations: harbor-connected city shape, flat-roofed dense quarters mixed
   with monumental precincts, a visually distinct fertile river corridor and
   dry terrain beyond. A screenshot does not establish which individual
   construction action produced every outlying model.
3. [Official Caesar in Gaul gallery](https://store.steampowered.com/app/261050/Total_War_ROME_II__Caesar_in_Gaul_Campaign_Pack/),
   [campaign image](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/261050/ss_1c9ae3d2b54412f5606f12b31c64bda4ea87495f.1920x1080.jpg).
   Observations: enclosed clusters of organic-roofed buildings, visible
   approaches, structures outside the boundary and substantial vegetation.
   The shot does not prove different Germanic and Celtic mesh selection rules.
4. [MK1212 Western Map Pack image](https://images.steamusercontent.com/ugc/1829030636960789590/3602333C974BC77376EA4E6371AA8B7AA013EDA3/).
   Observations: closely connected roof masses, narrow streets, irregular
   blocks, a clear wall hierarchy and landscape continuation beyond the city.
   Its medieval forms are not imported into ancient Roma.

These images were viewed as references in `.runtime/settlement-reference/`,
outside the game asset folders. They are not redistributed as our assets.
The older CloudFront full-size capital images were unavailable; a Pleiades
page encountered bot protection. These access failures are not filled in with
invented observations. No gameplay video was successfully inspected for this
study, so no video timestamp or video-derived claim is asserted.

## Principles learned and original implementation

**Silhouette before detail.** A theater's curved cavea, a temple's porch and a
farm's working compound communicate function before tiny props can be seen.
Our civic, sanctuary and farm ladders use different footprints, massing and
surrounding development. No reference-game landmark dimensions were traced.

**Connected quarters rather than scattered houses.** Dense street houses,
atrium compounds, mixed-height corner frontages and shops form Roma's residential
blocks. Aricia has a small number of rural compounds, fields and narrow tracks.
Density is composed around civic voids and rural uses, not uniformly applied.

**Development extends into terrain.** Farm stages cultivate 896, 2,808 and
6,072 m² in the illustrative local scale, with larger compounds and orchards.
Civic and religious stages expand paved/working/sacred courts and planting.
This is an original explicit environment system; the reference screenshots do
not prove Rome II dynamically changes the same acreage or prop lists.

**Landmarks and silhouettes use different scale rules.** Close views preserve
metres. Strategic renderers enlarge city symbols; they do not alter canonical
coordinates or claim geographically accurate city extents. Fields and detailed
props are culled at distance. A dedicated macro-city asset remains future work.

**Geography constrains specialized infrastructure.** A port should meet water,
fields follow land, and mine workings require a supported deposit. The current
pair has no extraction or port placement because that evidence was not
established. We do not infer deposit locations from a Total War resource map.

**Historical liberties are labelled.** The original Roman entertainment ladder
progresses through timber theater, a grand theater and an oval arcaded arena.
It deliberately compresses chronology under the user's game-design instruction.
It is not claimed to reconstruct entertainment buildings in 278 BCE. Forum III
is a game classification, not three literal historical stages. No exact
Colosseum facade, seating plan or proprietary mesh was copied.

## Cultural vocabulary: confirmed limits and original design

Only the Roman/Italic family has newly implemented architecture here. The other
families are extensible specifications with explicit missing-art behavior.

| Family | Reference evidence / limit | Our original vocabulary |
|---|---|---|
| Roman / Italic | Inspected campaign image; capital battle map documented separately. | Lime plaster, tuff relief, terracotta, arcades, civic courts, atria, varied narrow frontages. |
| Greek / Hellenistic | Official browser group; not a verified unique asset per Greek faction. | Ordered stoas, peristyle courts, stone plinths and pitched tiled roofs; civic space differs from our Forum. |
| Celtic | Organic-roofed campaign enclosure observed; regional attribution is limited. | Region-specific round and rectilinear halls, fenced compounds, thatch and timber. |
| Germanic | Shared broad browser chain; no independently verified mesh split from Celts. | Aisled longhouses, steep organic roofs, exposed structural posts and farm enclosures. |
| Thracian | Odrysian availability confirmed on shared chain, not unique mesh art. | Terraced timber/stone compounds and distinct cult enclosures, with regional variants. |
| Dacian | Getae/Dacia availability confirmed; later monuments are not period proof. | Hill compounds, raised stores, timber porches and regional dry-stone work. |
| Illyrian | Ardiaei availability confirmed; no unique library inferred. | Stone terraces, hill defenses, regional gateways and local organic/tiled roofing. |
| Punic | Carthage's bespoke battle map documented; full image unavailable. | Plastered courtyard merchant blocks, regional flat/pitched roofs and harbor-oriented trading space. |
| Kemetic Egyptian | Egypt reference shows traditional monumental cues amid a river landscape. | Mudbrick courts and terraces, battered sanctuary walls, pylons and stone cornices. |
| Hellenistic Egyptian | [CA's Egypt description](https://wiki.totalwar.com/w/Egypt_%28TWR2_faction%29.html) explicitly discusses Greek and Egyptian traditions. | Greek civic colonnades and Egyptian sanctuary traditions chosen by building provenance, not an obligatory hybrid on every house. |

The environment relationships are part of the art direction: Egyptian agriculture
would use evidenced water/field relationships; Punic commerce would use merchant
storage and waterfront access where appropriate. These are future vocabulary,
not implemented Egyptian/Punic scenes or claims about every reference game's
economic prop placement.

## What is implemented versus planned

Implemented: Roma and existing Aricia, six/four configurable slots, scenario
starting levels, 18 Roman primary stage assets with near/far versions, six
residential block types, three rural cluster types, crop tufts, terrain-following
environments, selector/upgrade UI, original sanctuary/civic/farm progression and
representative market/entertainment geometry. Existing material sources are
retained; new plaster and soil are CC0 Poly Haven maps.

Planned: finished non-Roman cultural kits, evidence-based extraction, actual
ports and water infrastructure, a full macro-city LOD, economy execution and
wider campaign population. No faction, army or character system is introduced.
