# Artwork production roadmap

**Status: Proposal (2026-10-14).** This is the production plan for the
presentation/art track. It sits **beside** `presentation-requirements.md` (the
seed for the future Visual Design Bible) and **ADR-0019** (presentation boundary
and visual design track). It blocks nothing in the simulation, and no artwork
production begins before the gates in §1.

The presentation track is **parallel and non-authoritative**: it visualises the
simulation and never becomes a second source of historical or geographic truth.

Research **R-9** (existing visual-language grounding) already exists; this
document adds **R-14** (asset-consistency and portrait-identity methodology).

## 1. Governance and prerequisites (gate before any production)

- **A Visual Design Bible must exist first.** `presentation-requirements.md` is
  its seed. Artwork is produced *against* a written standard (palette, line,
  rendering, iconography, typographic voice), not ad hoc. **No mass generation
  before the standard exists.**
- **A single asset standard.** One documented palette, view convention, aspect
  and metadata schema across all categories (§9), so assets are interchangeable
  and auditable.
- **Historical grounding track (R-9, R-14) runs alongside**, never blocking the
  simulation architecture (ADR-0019).
- **Presentation never blocks simulation.** No production dependency may push
  the simulation schedule.

## 2. Visual language and style tokens

Proposed direction to be formalised in the Visual Design Bible: **dark, aged
parchment, bronze and gold accents, restrained colour, engraved/relief
sensibility** for the interface frame; **photorealistic but historically
specific** for portraits, with a consistent light model. Define:

- a **palette** with fixed semantic roles (each colour has a meaning, so faction
  and status colours are consistent across all assets);
- **typography** with a period-suggestive but legible family and a strict
  hierarchy;
- a **style token set** (materials, lighting, edge treatment) that every asset
  family inherits, so portraits, emblems, events and the map read as one product.

## 3. Reference and evidence pipeline

Every historical subject gets a **reference record** before art is made:

- **Primary evidence** where it exists: coins, busts, statues, reliefs, mosaics,
  contemporary descriptions. (For 278 BCE figures: Pyrrhus, Ptolemy II and
  Antigonus II have coin/bust evidence; Fabricius and many others have **no
  surviving likeness** and must be **plausibly reconstructed**, not invented as
  famous faces.)
- **Explicit uncertainty.** Where no likeness survives, the reference record says
  so; the portrait is a plausible reconstruction, labelled as such internally.
- **Anachronism guards** (shared with content): **no denarius imagery** before
  241 BCE (use the period's coinage — didrachm/quadriga types, Ptolemaic and
  Carthaginian types), **no medieval heraldry**, period-appropriate arms and
  dress only.
- **No new archaeology in this pass**; use existing research documentation and
  catalogue knowledge (R-9), extend only with the constraints above.

## 4. Character portraits and identity consistency

The hardest production problem: the **same person across ages and contexts**.
Requirements:

- A **portrait identity sheet** per named character: fixed facial features, hair
  type/colour (period-correct), skin tone, build, distinguishing marks, habitual
  dress and insignia. The sheet is the single source of truth for every image of
  that person.
- **Age ladders**: portrait variants per life stage (child, young adult, adult,
  elder) that read as the same face, so a character ageing from e.g. a young
  officer to a king is believable. The historical timeline document's
  day-range/age-range policy means a **rendered age must match the simulated
  age**, and never show an unborn character.
- Split the population into two pipelines:
  - **Historical figures** — reference-led, identity-sheeted, one-off; used
    sparingly to protect their weight.
  - **Fictional / generated figures** — parameterised by **culture, class, age,
    sex, dress and phenotype** derived from scenario data, with controlled
    variation axes so a generated crowd never looks cloned, and never claims
    otherwise-unevidenced historical specifics.
- **Consistency mechanism** predates mass production: a locked identity sheet +
  a fixed generation recipe per figure, so a later re-render matches.

## 5. Faction and institutional emblems

- Period-appropriate **symbols and standards**, not medieval coats of arms:
  Roman legionary standards/aquila and the *SPQR* frame; Carthaginian symbols
  (Tanit, Baal-Hammon, Melqart) **used with care and internal consistency, not
  as modern flags**; Ptolemaic/Seleucid dynastic emblems and royal iconography;
  Greek city emblems; Gallic/Iberian tribal motifs.
- A **consistent emblem grammar** (shape, containment, colour roles) so a faction
  marker is instantly readable on the map and in UI, without implying a modern
  nation-state identity.

## 6. Government, institution and interface art

Art surfaces that express the political/economic layer:

- **Government type** identity (republic, kingship, oligarchy, league) as a
  granted visual language — one grammar, culturally specific expression
  (blueprint §6).
- **Office, court and institution** iconography (consulship, priesthood, Senate,
  royal court, temple, trade guild).
- **Economic/finance UI** grounded in the economic authority layer: treasuries,
  accounts, transactions and audits readable at a glance.
- **Crisis, legitimacy and claim** imagery.

## 7. Event illustration

- A small, reusable **illustration system** for event categories (political,
  military, economic, religious, personal), aligned with the event taxonomy
  (ADR-0005), rather than bespoke art per event.
- Every illustration carries **metadata** identifying its category, participants
  and period so it can be matched to an event definition by the presentation
  layer.
- **Reuse-first**: a shared library keyed by event category keeps the asset count
  bounded; recreation of the same event should reuse, not re-generate.

## 8. Settlements, architecture and the campaign map

- **Settlement and architecture** sets parameterised by **culture and period**,
  so a settlement's look derives from scenario data (who built it, when), not
  from hand-placed one-offs.
- **Campaign map** presentation builds on the authoritative geography (the Codex
  track) and **never becomes a second source of geographic truth** (ADR-0020
  layer 2). A 3D map exploration is a presentation experiment; it does not define
  the simulation's geography and must not leak renderer types into the domain
  (see `geography-integration-requirements.md` §7).
- Terrain/architecture variants are **derived from** geographic context
  (terrain, biome, coast), consistent with tactical continuity (ADR-0020 §6).

## 9. Asset pipeline, metadata and pitfalls

- **Asset metadata manifest** per asset: stable id; subject canonical ID (for a
  character/faction/location); culture; period; depicted age; viewpoint; palette
  tokens; provenance (**hand-made vs. generated**, and model/params if
  generated); licence/rights; resolution. Metadata is what lets the presentation
  layer match art to simulation state and lets us audit for anachronism.
- **Consistency gate**: no asset ships without an identity sheet (characters) or
  a reference record (historical subjects) and passing the anachronism guards.
- **Pitfalls to manage explicitly:** AI-generation drift (same subject looking
  like a different person), style drift across batches, cohort appearance
  anachronism, prop/coin/emblem anachronism, and **over-representation of
  famous figures**. Mitigations: locked sheets, fixed recipes, metadata auditing,
  and a deliberate allocation policy (see §4 sparing use of historical figures).
- **Rights and provenance** are tracked per asset so the whole library is
  auditable.

## 10. Open decisions and research

| ID | Item | Notes |
| --- | --- | --- |
| **R-9** | Historical visual-language grounding per culture | Art-direction research (existing) |
| **R-14** | Art-asset consistency and age-progression methodology; surviving-likeness evidence per historical figure | Art-direction research |
| **ADR-0019** | Renderer remains **Unresolved** | Presentation track; a renderer choice (e.g. a 3D library) is a pending decision, not an approved one |

## 11. Non-goals

- No Visual Design Bible content is authored here (this is a roadmap for it).
- No mass asset generation before the standard exists.
- No renderer choice, no UI implementation.
- No historical face invented and presented as evidenced.
- No presentation work blocking the simulation architecture.
