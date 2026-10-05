HISTORICAL GAME
Game Systems Blueprint
Vision and Simulation Architecture • V1

A historical grand strategy and character simulation where people create history, history changes people, exceptional people create institutions, and institutions shape future generations.

Status: Design source of truth for review before roadmap decomposition

# 1. Purpose of This Blueprint

This document formalizes the current game vision before implementation expands beyond the existing engineering foundation. It is intentionally a systems blueprint rather than a feature wishlist. The goal is to define what owns truth, how major systems interact, what causes what, where cultural variation enters the simulation, and which boundaries must remain stable when the project is decomposed into epics.

The historical starting world provides the initial conditions. After the game begins, outcomes are emergent. The simulation should create new histories rather than force the player through scripted historical outcomes.

## 1.1 Design laws

• People create history. History changes people. Exceptional people create institutions. Institutions outlive people and shape future generations.
• Shared simulation primitives, culturally specific expressions.
• The world contains objective state, but characters act according to the world as they understand it.
• The TypeScript simulation owns strategic truth. Tactical engines temporarily own tactical battle resolution.
• If the simulation does something interesting and the player cannot perceive why, the feature is not finished.
• Important characters should leave things behind: descendants, students, rivals, institutions, doctrines, reputations, memories, laws, movements, and stories.
• AI may interpret, reason, speak, and propose. AI does not invent canonical world state or bypass simulation rules.

## 1.2 What is not locked yet

•	Exact historical start date.
•	Exact turn duration, action point model, and movement cadence.
•	Final campaign rendering technology. Unity/C# is a candidate, not a commitment.
•	Exact government mechanics for every culture.
•	Exact economic granularity and resource taxonomy.
•	Final multiplayer design.
•	Exact Jev API and responsibility boundary beyond the principles in this blueprint.
•	Production UI and art direction.
•	Calendar estimates. Roadmap order must come from dependency analysis rather than an invented timeline.

# 2. Player Identity and Continuity

The player participates in the life of a state or faction, but continuity is carried through a political family or power bloc and its current characters. The player is therefore neither an immortal ruler nor merely an abstract country. A family can gain or lose offices, influence, military commands, claims, and even control of the state while remaining the player's persistent political lineage.

```
PLAYER CONTINUITY
      ↓
Family / Power Bloc
      ↓
Current Controlled Character(s)
      ↓
Offices • Titles • Claims • Commands • Influence
      ↓
May gain or lose control of state institutions
      ↓
Marriage • Children • Succession • Rival Branches carry continuity
```

In Rome this may mean competing for consulships, Senate influence, provincial commands, and military prestige. In a monarchy it may mean serving a dynasty, marrying into it, contesting succession, becoming a claimant, or eventually replacing the ruling house. Other societies must express political continuity through their own historically grounded social structures rather than a Roman template.

# 3. World Simulation

The world simulation is the authoritative strategic layer. It owns geography, time, faction state, settlements, population aggregates, characters, armies, economy, diplomacy, politics, knowledge, historical events, and persistent consequences.

| System | Owns | Feeds |
| --- | --- | --- |
| Geography | Regions, terrain, rivers, roads, passes, seas, settlements, spatial relationships | Movement, supply, trade, intelligence, battles |
| Factions | Government, institutions, laws, territory, treasury, culture, religion | Politics, diplomacy, military, events |
| Population | Aggregate demographics, labor, manpower, local pressures | Economy, recruitment, unrest, migration |
| Characters | Life history, traits, relationships, memories, offices, knowledge, reputation | Politics, military, education, institutions, AI |
| Settlements | Population, production, buildings, institutions, garrisons, local authority | Economy, education, logistics, politics |
| Historical Events | Canonical ledger of what actually happened | Memory, reputation, knowledge, politics, narrative |

# 4. Characters, Families, Marriage, Children and Life History

Characters are first class entities with lives, not portraits attached to modifiers. A mature character should be explainable through ancestry, childhood, education, mentors, marriages, children, offices, battles, relationships, memories, achievements, failures, beliefs, and reputation.

## 4.1 Character state

•	Identity: name, age, culture, religion, sex, social position, health.
•	Psychology: ambition, envy, courage, greed, compassion, pride, paranoia, religiosity, and other dimensions appropriate to the design.
•	Traits and skills that influence both numeric capability and behavior.
•	Offices, titles, claims, wealth, prestige, influence, legitimacy, popularity, elite support, and army loyalty.
•	Knowledge and beliefs separated from world truth.
•	Relationships that can simultaneously contain affection, trust, fear, respect, rivalry, obligation, and remembered events.
•	Life history composed from canonical historical events.

## 4.2 Family and dynasty

•	Parents, siblings, spouses, children, extended kin, household and dynasty or house.
•	Marriage as a personal, dynastic, diplomatic, economic, religious, and political act.
•	Children as future characters whose upbringing and education are simulated rather than instantly assigned adult stats.
•	Inheritance, legitimacy, succession, rival branches, claims, remarriage, widowhood, and culture specific family rules.
•	Family reputation and inherited social expectations without making descendants deterministic copies of ancestors.
•	Deaths should destabilize networks: succession, alliances, army loyalty, marriages, patronage, offices, and rivalries can all react.

## 4.3 Childhood and development

Education is a process. Guardians, mentors, family circumstances, settlement institutions, culture, religion, experiences, peers, and historical events can shape traits, skills, beliefs, relationships, and future opportunities.

# 5. Education, Knowledge Transmission and Institutions

The simulation must not assume that formal schools are universal. The shared primitive is knowledge and tradition being transmitted through culturally appropriate people and institutions. A Hellenistic philosopher, Roman military teacher, Gallic learned or religious authority, and Germanic tradition bearer may occupy very different social roles while using compatible simulation concepts underneath.

```
Prestigious / Knowledgeable Character
      ↓
Culture appropriate role or institution
      ↓
Students • Followers • Apprentices • Warriors • Initiates
      ↓
Skills • Traits • Knowledge • Relationships • Memories
      ↓
Graduates enter society and create new history
      ↓
Traditions can persist, split, evolve, rival one another, or disappear
```

## 5.1 Institutions can outlive founders

•	A renowned philosopher may found or lead a school that attracts students and raises settlement prestige.
•	A celebrated general may train future commanders, transmitting doctrine shaped by actual campaigns and battles.
•	Religious or learned authorities may train followers through structures appropriate to their culture rather than a universal academy.
•	Institutions accumulate leaders, students, prestige, specializations, internal disputes, traditions, and historical events.
•	Students form relationships with teachers and one another. Those relationships can matter decades later.
•	A student can reject a teacher's ideas, create a rival tradition, or carry a doctrine into another settlement or political system.

## 5.2 Generalized institution concept

```
Institution
  id
  settlementId
  culturalContext
  religiousContext
  type / socialRole
  founderId?
  leaderId?
  teachers / authorities
  students / followers
  prestige
  specializations / traditions
  requirements
  historicalEventIds
  relationships to faction, family, settlement and religion
```

# 6. Culture, Religion and Government as Mechanical Context

The game must not become a Roman simulation with different portraits. Shared primitives exist so the engine remains coherent, but culture, religion, government, kinship, social authority, and historical circumstance determine which roles, institutions, events, decisions, obligations, and paths are available.

| Shared primitive | Possible culturally specific expression |
| --- | --- |
| Authority | Consulship, kingship, assembly leadership, clan authority, religious authority, court office |
| Education | Formal school, household tutoring, military mentorship, priestly instruction, oral tradition, apprenticeship |
| Prestige | Triumph and office, battlefield reputation, lineage, religious standing, patronage, wisdom, wealth |
| Political conflict | Senate rivalry, court faction, succession crisis, feud, confederation dispute, assembly opposition |
| Knowledge transmission | Texts, teachers, oral tradition, ritual, military practice, family mentorship, itinerant specialists |
| Events | Conditions and consequences differ, not merely flavor text |

Implementation rule: culture specific behavior should usually be expressed through data, rules, event conditions, roles, weights, permissions, and decision models built on shared domain primitives. Bespoke mechanics are allowed when the society genuinely requires them.

# 7. Government, Politics and Power

Government is a rules layer that interprets shared political primitives. Characters pursue offices, influence, legitimacy, wealth, military commands, dynastic security, religious authority, or other goals according to the society they inhabit.

•	Political offices and commands belong to the world, not merely to UI menus.
•	Military success can increase prestige, popularity, army loyalty, family reputation, fear and elite opposition simultaneously.
•	Powerful characters can become threats to existing institutions even when they are successful servants of the state.
•	Civil wars should emerge from accumulated political and military pressures rather than only scripted event chains.
•	Government transitions should be possible when the simulation creates the conditions for them.
•	Autonomous characters need goals, constraints, knowledge, relationships and incentives. They should not be passive stat containers.

# 8. Intelligence, Knowledge, Rumor and Information Propagation

Information is a first class simulation domain. World truth, reports, rumors, and individual belief are separate. Characters and factions make decisions from what they know or think they know, allowing uncertainty, delay, deception, bias and misunderstanding to create strategy and history.

```
WORLD TRUTH
      ↓ observation
Scouts • Outposts • Witnesses • Merchants • Diplomats • Messengers
      ↓ reporting / travel delay
REPORTS AND RUMORS
      ↓ interpretation
FACTION / CHARACTER KNOWLEDGE
      ↓
Decisions based on belief rather than omniscience
```

•	Observation records can contain estimated strength, position, direction, confidence, observed time and reported time.
•	News should propagate through geography and social networks rather than teleport globally.
•	Rumors may mutate as they travel.
•	Reputation can be local and audience specific. The same general may be 'the Great' at home and 'the Butcher' among conquered peoples.
•	AI character context must be filtered through knowledge state so an AI cannot accidentally act on secrets it does not know.

# 9. Military, Armies, Logistics and Strategic Geometry

Army maneuver and intelligence are core MVP gameplay. Armies are spatial organizations rather than single map tokens. Detachments can occupy different positions, move on different routes, scout, screen, reinforce, flank, protect supply, and encounter enemies independently.

```
Army
      ↓
Supreme Commander
      ↓
Vanguard • Main Body • Rear Guard • Supply Train • Other Detachments
      ↓
Subcommanders • Scouts • Units
      ↓
Routes • Terrain • Supply • Fatigue • Intelligence • Distance
      ↓
Contact / Battle Encounter
```

•	A vanguard may enter battle before the main body.
•	Reinforcement arrival is derived from real campaign position, route and effective movement rather than arbitrary battle scripting.
•	Outposts and scouts create observations that feed the knowledge system.
•	Rivers, mountains, passes, roads, lakes, coasts and other geography must materially affect maneuver.
•	Commanders and subordinate commanders are characters, so battle outcomes feed directly into relationships, prestige, injury, death, succession and politics.

# 10. Tactical Battle Boundary: Rome II + Divide et Impera

The campaign simulation does not continuously mirror Rome II movement and Rome II does not own campaign systems. The tactical engine receives a prepared battle, resolves combat, and returns the result. This prevents dual authoritative strategic simulations.

```
TypeScript World: authoritative strategic state
      ↓
BattleState
      ↓
Rome2DeIAdapter
      ↓
Rome II / DeI: temporary tactical authority
      ↓
BattleResult
      ↓
TypeScript World applies casualties, injuries, deaths, prestige, occupation, memories and consequences
```

DeI supplies tactical vocabulary. Rome II supplies the battlefield. Our simulation supplies reality. DeI unit and battlefield catalogs are adapter resources, not domain entities.

## 10.1 BattleState should eventually describe

•	Participants and faction/culture context.
•	Army and detachment composition.
•	Commanders and units.
•	Campaign derived positions and reinforcement timing.
•	Terrain, season, weather, settlement/river/coast context.
•	Fatigue, supply and other strategically meaningful pre battle state.
•	Battle stakes and encounter context once those concepts are designed.

# 11. Historical Event and Causality Engine

A canonical event ledger connects the simulation. Systems should react to meaningful domain events instead of mutating unrelated systems through a giant world manager.

```
HistoricalEvent
  id
  date
  type
  participants[]
  factions[]
  locations[]
  magnitude
  causes[]
  consequences[]
  witnesses[]
```

## 11.1 Example: battle to civil conflict

```
Battle Won
      ↓
HistoricalEvent created
      ↓
General gains military prestige
      ↓
Army loyalty • popular reputation • family prestige • foreign fear change
      ↓
Political rivals react
      ↓
Recall / investigation / office denial / coalition / propaganda
      ↓
Character chooses response
      ↓
Compliance, negotiation, defiance, rebellion or other legal action
      ↓
New historical events
```

## 11.2 Example: intellectual legacy

```
Renowned thinker emerges
      ↓
Founds or leads culturally appropriate institution
      ↓
Students gather and form relationships
      ↓
Ideas and skills propagate
      ↓
Students enter politics, religion, administration or teaching
      ↓
Founder dies
      ↓
Institution, pupils, writings/traditions and rival schools can remain
```

# 12. Settlements, Population, Economy and Trade

Population is primarily aggregate while important characters are simulated individually. Settlements are places where population, production, institutions, military presence, politics and culture meet. Economic mechanics should create causal chains that other systems can react to.

```
Harvest / Production
      ↓
Food and goods
      ↓
Prices • population health/growth • taxation • trade
      ↓
Unrest / prosperity / migration / manpower
      ↓
Political and military consequences
```

•	Settlement development should matter materially, not only visually.
•	Trade should interact with geography, diplomacy, prestige, security and information propagation.
•	Institutions live in settlements and can change their prestige and strategic value.
•	Garrisons, outposts and local authority connect settlements to warfare and intelligence.
•	Exact resources, market detail and population formulas remain unresolved for V1.

# 13. Diplomacy, Religion, Culture and Reputation

Foreign diplomacy, internal politics, religion and culture overlap but are not the same system. Diplomatic authority itself may differ across societies, creating meaningful misunderstandings about who can make promises, bind a polity, negotiate peace, arrange marriage, or commit forces.

•	Treaties, war, alliances, trade, marriage and trust should depend on actors, institutions and authority.
•	Culture should change mechanics and expectations, not simply add relation modifiers.
•	Religion shapes legitimacy, interpretation, institutions, events and relationships.
•	Reputation is audience dependent and can propagate through information networks.
•	A diplomatic agreement may fail because the person who made it lacked the authority another society assumed they possessed.

# 14. Character Intelligence: Jev inside TheRev

The game is launched through TheRev. Jev belongs in TheRev as a reusable character and agent intelligence capability rather than being embedded as the owner of game state. The historical game supplies structured character state, knowledge, memories, relationships, current concerns and legal action space. Jev can reason, interpret, converse and propose intent.

```
Historical Game TypeScript Simulation
      ↓ filtered context
Character State • Knowledge • Memories • Relationships • Available Actions
      ↓
TheRev AI Runtime
      ↓
Jev • Ollama • optional cloud providers
      ↓
Reasoning • Dialogue • Interpretation • Proposed Intent
      ↓
TypeScript validates intent and applies legal world action
      ↓
HistoricalEvent + new state
```

## 14.1 Hard boundary

•	Jev does not invent armies, money, relationships, offices, locations or events as canonical facts.
•	Jev does not directly mutate authoritative simulation state.
•	Jev receives only knowledge the character is allowed to possess.
•	The simulation determines legal actions and validates proposed intents.
•	Dialogue may lie, exaggerate, conceal or repeat rumor when character state permits it, but lies remain dialogue or belief rather than silently becoming world truth.
•	Local AI must remain optional. Deterministic/template narrative paths should exist when no model is available.

Working mental model: the simulation gives characters a life; the event system gives them a history; the knowledge system gives them a perspective; Jev can give them a mind.

# 15. Turn Engine

The current direction is turn based. The exact temporal scale is unresolved. The turn engine should orchestrate systems without becoming the owner of their domain logic.

```
Turn Start
      ↓
Scheduled world updates
      ↓
Player orders and political actions
      ↓
Autonomous character / faction decisions
      ↓
Movement • contact • intelligence updates
      ↓
Battles • events • economy • settlement consequences
      ↓
Knowledge and rumor propagation
      ↓
Persistence / snapshot
      ↓
Turn End
```

# 16. Technical Architecture Principles

•	Domain code remains engine agnostic. No Rome II unit keys, XML, Lua, filesystem paths or tactical catalog implementation details in core domain types.
•	Repository interfaces separate simulation/domain logic from ORM and database technology.
•	Persistence should support a long lived world, historical event ledger, character history and recovery without making every domain object an ORM entity.
•	The running world may live largely in memory while snapshots, events and durable state are persisted.
•	Adapters translate domain state into external tactical or AI vocabulary.
•	The existing BattleAdapter boundary remains the foundation for tactical integration.
•	TheRev integration should be through a defined game/AI SDK boundary rather than unrestricted process, filesystem or browser access.

```
Simulation / Domain
      ↓
Repository Interfaces
      ↓
Persistence Layer
      ↓
ORM
      ↓
Database
```

```
Game Character Context
      ↓
TheRev Game/AI SDK
      ↓
Permission + AI Gateway
      ↓
Jev / Ollama / Cloud
```

# 17. V1 System Relationship Map

This is the textual source for the next visual map. Arrows indicate primary causal flow, not exclusive ownership.

```
HISTORICAL START STATE
        ↓
WORLD SIMULATION
 ├─ Geography ──────→ Movement / Trade / Supply / Intelligence
 ├─ Factions ───────→ Government / Politics / Diplomacy
 ├─ Population ─────→ Economy / Manpower / Unrest
 ├─ Settlements ────→ Institutions / Production / Garrisons
 ├─ Characters ─────→ Families / Offices / Commands / Relationships
 └─ Religion/Culture→ Roles / Events / Authority / Education

PLAYER CONTINUITY = FAMILY / POWER BLOC
        ↓
Current Character(s) ↔ State Institutions ↔ Rival Characters/Families

ARMY
Commander → Vanguard / Main / Rear / Supply → Scouts
        ↓
Movement + Geography + Intelligence
        ↓
Battle Encounter
        ↓
BattleState → Rome2DeIAdapter → Rome II / DeI → BattleResult
        ↓
HistoricalEvent
        ↓
Characters / Politics / Families / Economy / Diplomacy / Reputation
        ↓
Information & Rumor Propagation
        ↓
Character Knowledge
        ↓
Autonomous Decisions + Jev Interpretation
        ↓
New Actions / New Events
        ↺

EXCEPTIONAL CHARACTER
        ↓
Culture appropriate Institution / Tradition
        ↓
Students / Followers
        ↓
Next generation of Characters
        ↓
New politics / warfare / religion / knowledge
        ↺
```

# 18. Explicit Open Questions for Design Review

1.	What exact historical starting date and initial political map should V1 use?
2.	What does one turn represent, and how should movement time interact with turns?
3.	How much direct control does the player have over family members who are not the current primary character?
4.	How should childhood age bands, guardianship, education duration and coming of age differ by culture?
5.	Which family rules must be culture or religion specific at launch?
6.	Which government types and factions are required for the first playable vertical slice?
7.	What is the minimum economy needed to make settlement development, supply and war causally meaningful?
8.	What information channels exist at launch: scouts, outposts, messengers, merchants, diplomats, spies, religious networks?
9.	How are lies, deliberate deception and propaganda represented separately from ordinary rumor?
10.	Which institutions are generic engine concepts and which need bespoke mechanics?
11.	What structured action vocabulary should autonomous characters and Jev be allowed to propose?
12.	How much strategic AI is deterministic/utility based versus Jev assisted?
13.	What data must persist every turn versus be reconstructed from snapshots and event history?
14.	What is the first campaign map region used to prove movement, intelligence, settlement and battle integration?
15.	What exact Rome II/DeI generated battle is the first executable round trip POC?

# 19. OpenCode / Big Pickle Handoff Contract

This blueprint should be treated as product and domain intent. The coding agent should not invent unresolved game mechanics merely to complete an implementation plan. Unknowns remain explicit design questions until resolved.

## 19.1 What OpenCode should do after approval

•	Read this blueprint together with the repository architecture and Rome II/DeI research handoff.
•	Inventory the current code against the domains described here.
•	Produce a dependency graph before producing a calendar.
•	Propose epics and vertical slices with acceptance criteria.
•	Identify architectural decisions that must be made before each epic.
•	Preserve domain purity and the tactical adapter boundary.
•	Mark every assumption that is not explicitly supported by this blueprint.
•	Do not implement culture specific mechanics from stereotypes or guessed history. Flag them for research/design.
•	Do not make Jev or any LLM authoritative over world state.

## 19.2 Proposed planning sequence

```
Blueprint review and approval
      ↓
Domain relationship model
      ↓
Event / causality graph
      ↓
System dependency graph
      ↓
Architecture decisions
      ↓
Epics and vertical slices
      ↓
Stories + acceptance criteria
      ↓
Milestones and estimates
      ↓
Implementation
```

# 20. Candidate Vertical Slices to Evaluate During Roadmapping

These are candidates, not a locked roadmap. The dependency analysis may reorder or split them.

| Candidate slice | Proves | Key systems |
| --- | --- | --- |
| Living Character | A character has family, memories, relationships, education and a changing life history | Character, Family, Event, Persistence |
| Army in a Real World | An army with detachments moves through geography and creates observations | Geography, Army, Movement, Intelligence |
| Generated Tactical Battle | Arbitrary BattleState launches Rome II/DeI and returns BattleResult | BattleAdapter, catalogs, launcher, result ingestion |
| Battle Becomes History | Tactical outcome changes casualties, prestige, memories, politics and knowledge | Events, Character, Politics, Information |
| Institutional Legacy | A renowned character teaches others and leaves a persistent institution/tradition | Education, Institution, Settlement, Character |
| Different Societies | Two societies express authority, education and events differently using shared primitives | Culture, Religion, Government, Events |
| Character Mind | Jev reasons and speaks from filtered knowledge without owning truth | TheRev SDK, Jev, Knowledge, Character AI |

# 21. V1 Definition of Success

V1 design is successful when the project can explain not only what systems exist, but why an event in one system causes consequences in another; when a Roman, Gallic, Germanic, Hellenistic or other society can express different social structures without requiring a separate engine; when characters possess families and life histories rather than static modifiers; when information is imperfect; when tactical battle results become canonical history; when institutions preserve human legacy; and when Jev can enrich character intelligence without ever becoming the authority over reality.

END OF BLUEPRINT V1
