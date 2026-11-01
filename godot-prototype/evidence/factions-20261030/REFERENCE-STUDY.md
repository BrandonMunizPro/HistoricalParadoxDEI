# Reference study and original adaptation

The request is for political-map identity and placement, not replication of either game's simulation. Reference-game rosters are useful game-design comparisons; neither game's starting map is evidence of exact frontiers in our 278 BCE scenario.

| Reference | Supported observation | Adaptation |
|---|---|---|
| [Rome II official faction index](https://wiki.totalwar.com/w/Factions) and [official campaign controls guide](https://academy.totalwar.com/total-war-rome-2-campaign-controls/) | Named factions are distinct from broad cultural groupings; campaign presentation supplies recognizable faction identities. | Separate faction records and cultural families; original emblem/color/name combinations. No copied banners or UI assets. |
| [Divide et Impera faction map](https://divideetimperamod.com/factions/) | Its interactive roster/map exposes many regional factions beyond the major Mediterranean powers. | Include smaller Italic, Gallic, Iberian, Illyrian, Thracian, North African and other regional groups. This reference supplies associations, not reliable 278 BCE geometry or proof of every tribal name at that date. |
| [Imperator countries reference](https://imperator.paradoxwikis.com/Countries) and [Imperator overview](https://en.wikipedia.org/wiki/Imperator:_Rome) | Country identity and a broad political map support reading many polities, rather than coloring every member of a cultural family identically. Imperator's default start is 304 BCE. The country-reference page was not fully retrievable in this environment; no exhaustive roster export or detailed implementation claim is based on it. | Independent faction palette entries; regional political identities and searchable navigation. We do not import Imperator's country/province files, flags or exact borders. |

Rome II's grand campaign starts in 272 BCE ([overview](https://en.wikipedia.org/wiki/Total_War:_Rome_II)); Imperator starts in 304 BCE. Their maps cannot simply be combined into 278 BCE. These are confirmed date differences, not interpretations of our screenshot.

The design inference is that zoomed-out readability benefits from broad color fields, recognizable emblems, prioritized labels and a roster for small polities. Our implementation uses original symbols, existing neutral-map shaders and existing world coordinates. It does not reproduce either game's provincial subdivision or claim its territorial rendering implementation is the same.

## Historical placement and uncertainty

Actual dated geometry comes from [Cliopatria](https://github.com/Seshat-Global-History-Databank/cliopatria), [Bennett et al. 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC11822181/), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The source year filter is inclusive at −278. Of 44 worldwide features active at that date, 26 intersect the existing map bounds. Twenty-four major source records plus six identified Greek components produce 30 rendered source-reconstruction regions. These remain coarse, uncertain reconstructions, not surveyed lines.

The remaining 98 regions are original provisional game-scenario envelopes. They are visibly differentiated and explicitly labeled in data/UI. Many tribal names are better documented in later periods. Their inclusion supplies requested game diversity, not newly researched certainty. Gray land means unassigned, not empty or uninhabited.

Specific chronological safeguards:

- [278 BCE chronology](https://www.attalus.org/bc3/year278.html) informs the Pyrrhic and Macedonian context. Allied cities are not automatically assigned to Epirus.
- [Oxford's Galatia study](https://academic.oup.com/edited-volume/61673/chapter-abstract/548936586) distinguishes crossing into Asia Minor in 278 from subsequent settlement. Three Galatian groups receive arrival markers, not a fixed later Galatian kingdom.
- [Encyclopaedia Iranica: Bactria](https://www.iranicaonline.org/articles/bactria/bactria-i-pre-islamic-period/) places independent Bactrian kingship later in the third century. No independent Bactria or Parthia is inserted into this initial scenario.
- [Masaesyli and Massylii reference](https://www.worldhistory.org/article/1196/the-masaesyli-and-massylii-of-numidia/) supports distinguishing the two Numidian identities, but does not establish precise 278 BCE borders. Both rendered regions are provisional.

No source establishes all 131 entries as independently sovereign states with definitive boundaries in 278 BCE. Names ending in “polities,” contested kingship, and presence-only entries intentionally avoid that claim. Placement and granularity should be reviewed before treating this layer as a finalized campaign scenario.
