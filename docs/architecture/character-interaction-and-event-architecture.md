# Character interaction and event architecture

**Status: Proposal (2026-10-14).** This document decomposes *character
development and interaction*: the traits/psychology gap left by VS-4, the
distinction between legitimacy and personal reputation, how one character acts on
another, and how event eligibility and consequences should be evaluated. It
depends on the delivered VS-4 character aggregate (`src/domain/character/`) and
on **ADR-0005** (event taxonomy), **ADR-0006** (legal-action gate), **ADR-0002**
(causal ledger) and **ADR-0012** (Jev/TheRev boundary).

Open decisions **AD-28** (trait/psychology representation) and **AD-29**
(event eligibility/consequence evaluation + dialogue boundary) block
implementation. This is the mechanism layer behind proposed slices **S14**
(Consequential Interaction) and **S7** (Character Mind).

> **Direction approved 2026-10-14; decisions remain open.** The decomposition is
> approved, with refinements incorporated below: **stable psychological
> dispositions are kept separate from relational loyalty, reputation and
> legitimacy** (§2), trait values are **deterministic integers with recorded
> transitions** (§3), and the **deterministic evaluator / legal-action gate /
> presentation-only dialogue boundary is reaffirmed** (§5, §6). **AD-28 and AD-29
> are not closed.**

## 1. What VS-4 delivered, and what is deliberately missing

VS-4 shipped a Living Character aggregate that is **already the right shape** for
this expansion and must not be rewritten:

- `Character` holds identity, kinship links, a **life history**, a
  **multi-facet relationship** set, memories referencing canonical ledger
  events, and a succession designee.
- `rememberEvent`, `recordDeath`, `designateSuccessor` are the only mutators; all
  consume canonical ledger references.
- There are **no traits, no offices, no psychology** — deliberately, to keep
  VS-4 about *life, kinship and memory*.

This document proposes what fills that gap later, in a way that preserves VS-4's
invariants. Nothing here is an instruction to modify delivered code now.

## 2. Dispositions, loyalty, reputation and legitimacy are four different things

A single "character score" would collapse distinctions the design needs. The
proposal keeps **four orthogonal concepts**, plus personal standing as a fifth:

| Concept | Kind | Definition | Changes when | Feels like |
| --- | --- | --- | --- | --- |
| **Stable psychological dispositions** (traits) | Canonical **self-state** | The character's own enduring temperament: ambition, diligence, cruelty, piety, courage, vanity, avarice… — a property of *the person*, not of any relationship | Slowly, via life history and events | "Fabricius is incorruptible" |
| **Relational loyalty** | Canonical **directed attitude** | This character's disposition **toward a specific other** (a person, house, faction or office): fealty, trust, resentment, a patron–client bond | Via interactions with that target | "that legion is loyal to its commander" |
| **Reputation (audience-scoped)** | **Belief held by a perceiver** | What a *specific audience* believes about this person — a perceiver belief, not a fact | Via information flow (E5) | "Rome believes Fabricius is incorruptible" |
| **Legitimacy** | **Belief about rightfulness** (ADR-0011) | The perceived *rightfulness of a claim* (blood, office, acclamation, conquest, divine sanction) | Via political events and information | "the claim is believed just" |
| **Personal prestige / charisma** | Canonical **self-state** (personal standing) | How impressive, beloved or feared this person *is*, independent of office and independent of any one audience | Via deeds, oratory, battles, gifts | "Pyrrhus is formidable in person" |

**Why these stay separate (refinement 2026-10-14).**

- **Disposition ≠ loyalty.** A cruel man can be loyal to his brother; a kind man
  can betray his city. One is a trait of the person, the other a directed
  attitude toward a target. Collapsing them makes "he is loyal" a personality
  fact, which is wrong and unactionable.
- **Loyalty ≠ reputation.** My loyalty to you is *my* state; your reputation in
  my eyes is *my belief about you*. They move for different reasons and must be
  stored in different places.
- **Reputation ≠ legitimacy.** Reputation is what an audience thinks of a person;
  legitimacy is what is believed about the *rightfulness of a claim*. A widely
  admired man can hold a claim nobody considers legitimate.
- **None of the first four is canonical truth about the world**, except the two
  self-states; reputation, loyalty-as-believed and legitimacy are **perceiver
  beliefs** and must route through the knowledge system (E5).

**Rule.** A character's own traits and directed loyalties are **canonical
self-state**; a *reputation* and a *perceived legitimacy* are **beliefs held by a
perceiver** and must be routed through the knowledge system (E5) so that a person
can be admired, feared, misunderstood or slandered, and the world can be *wrong*
about them. This is the same self/knowledge split the game already makes for the
whole world (ADR-0002): never let a belief be stored as truth.

## 3. Traits: proposal for AD-28

**Proposal.** Traits are a small, named, bounded vector of **facets**, defined as
scenario content (ADR-0013), not hard-coded:

- A **facet** is content: name, integer range, what it *does* (which eligibility
  rules and decision weights it feeds), and which events *move* it.
- **Deterministic integers, never floats** (refinement 2026-10-14). Facet values
  are **fixed-point integers** (e.g. a 0..1000 scale), exactly as SimTime is
  fixed-point (ADR-0003), so results are reproducible and free of binary
  floating-point drift. This also feeds the same determinism guarantee as
  ADR-0008: same inputs ⇒ same values.
- Facets are **few and legible** (think a dozen, not a Big-Five clone): the player
  must be able to say "he is ambitious and ruthless" and see it matter.
- **Traits move through recorded transitions.** A betrayal may raise cruelty, a
  defeat may lower confidence; every movement is a validated mutation with a
  ledger cause, and the **transition itself is recorded** (old value → delta →
  new value, with its cause), so "he became paranoid" is explainable from the
  trace. Transitions are additive integer deltas, clamped to the facet's range.
- Traits are **dispositions only** (§2): they never store a relationship-directed
  attitude (that is **relational loyalty**, its own separate state) nor a
  perceiver belief (that is reputation/legitimacy). A trait is read by the
  eligibility and decision evaluators below; it is not a summary of how the world
  feels about the character.

**Unresolved (AD-28):** exact facet list, integer scales/ranges, and the transition
function (which events move which facet and by how much). This is the
"trait/psychology ranges" item already parked under E4; it is now given an ID so
it cannot be silently resolved during implementation.

## 4. Interaction: an actor acts on a target

An **interaction** is one character acting on another through a social/legal
channel: command, persuade, deceive, accuse, pardon, honour, patronise, bribe,
appeal to kinship, request a favour, declare a rivalry, honour a debt, form a
comitatus-like bond.

**Proposal.** Every interaction is modelled as a **proposal into the legal-action
gate** (ADR-0006) — never a bespoke mutation path:

1. The actor **proposes** an interaction against a target, citing a capability
   (e.g. a consul's command, a patron's claim on a dependant, a kinsman's kinship
   duty).
2. The gate **validates** using the political layer's derived authority, the
   relationship facets, and the target's own state.
3. If accepted, the interaction applies **canonical state mutations** through the
   owning systems (relationships, traits, offices, economy) and appends a
   canonical ledger event (ADR-0002) with causes and consequences.

This reuses the approved architecture rather than inventing a parallel
"social engine". It also means AI actors and the player go through the **same**
gate.

## 5. Event eligibility and consequences

**Proposal (AD-29).** Event eligibility is a **pure predicate over authoritative
state**, evaluated **at execution time** by a scheduled trigger — consistent with
standing constraint 11 and ADR-0003 A5 ("scheduled work is a trigger that reads
authoritative state, never a precomputed outcome"). **Reaffirmed 2026-10-14:** the
evaluator stays a **deterministic** function of the state snapshot; it must not
consult wall-clock, ambient randomness or AI output (§6).

- **Eligibility** = "can this event fire right now for these participants?"
  Inputs: offices/capabilities, traits, relationships, memories, wealth, political
  circumstances, and the target's knowledge state.
- **Options** = an event may offer the actor (or player) a set of choices. Each
  option is a **validated proposal** into the gate (§4), never a free write.
- **Consequences** = state mutations produced *through the owning systems*, so a
  choice that costs money goes through the economic ledger, a choice that
  removes an office goes through the political layer, and a choice that wounds a
  relationship goes through the relationship aggregate.
- **Reaction** = a character reacts to what they *know*, filtered through their
  traits, memories, relationships and legitimacy — not to the omniscient truth.
  An AI character's reaction is a derivation, not a scripted branch.

**Significance** (ADR-0005) applies unchanged: an interaction's consequences
enter the ledger with the same four classifications; the significance gate keeps
the ledger proportional.

## 6. Dialogue is presentation, not authority

Dialogue is the **presentation** face of an interaction. The architecture keeps a
hard boundary:

- The **simulation** owns: eligibility, options, their validated consequences,
  and the canonical ledger event.
- The **presentation layer** owns: rendering the interaction as narrative text
  (portrait + prose + choices) and the flavour of that text.
- AI-generated dialogue (via the Jev/TheRev boundary, ADR-0012) may **write the
  flavour**, but may **never** choose eligibility, add or alter options, or
  mutate state. If no model is available, a **deterministic template** renders
  the same interaction and the same choices (a standing requirement of S7).
- The **player** interacts through presented options; choosing an option is the
  player submitting a legal action, nothing more.

**Rule.** A dialogue screen may only ever *display* choices the simulation has
already validated as available. It may never *invent* an option at render time.
**Reaffirmed 2026-10-14:** dialogue is **presentation-only**; the boundary above is
not negotiable and applies equally when AI writes the text and when a
deterministic template does.

## 7. Determinism and memory

- Every interaction and its consequences are **append-only ledger events**
  (ADR-0002), so a character's whole social history is reconstructible.
- Memories **reference** canonical ledger events by ID (already VS-4 behaviour);
  a memory's target stays resolvable even after the target ends (ADR-0009 §3).
- Trait movement caused by an interaction is itself recorded, so "why is he
  suspicious now?" is answerable from the trace.
- No `Date`, no wall-clock, no randomness that is not seeded and reproducible
  (ADR-0008).

## 8. Interaction with other systems

| System | Interaction |
| --- | --- |
| **VS-4 character aggregate** (delivered) | Consumes it as-is; traits/offices/reputation are *additive*, not a rewrite |
| **E9 / political office layer** | Provides the capabilities an interaction cites; office conflicts are interaction targets |
| **E5 knowledge** | Reputation and reaction are perceiver beliefs filtered through information flow |
| **E14 internal crisis** | A cascade of disaffected characters (trait + relationship + legitimacy derived) is a crisis *input*, not a random war |
| **E16 Jev** | Jev may reason over a character's state to *suggest* flavour or a role-play; it can never submit an unvalidated interaction |
| **E18 mutable government** | A regime change is itself an interaction (a legal action) with character reactions |

## 9. Open decisions and research

| ID | Item | Blocks |
| --- | --- | --- |
| **AD-28** | Trait/psychology facet representation: exact facet list, **deterministic integer scales/ranges**, and the recorded transition function — with **dispositions kept separate from relational loyalty, reputation and legitimacy** (consolidates the unnamed E4 "trait/psychology ranges" blocker). Direction approved 2026-10-14; **not closed** | E4 expansion, S14 |
| **AD-29** | Event eligibility/consequence evaluation shape (deterministic evaluator over a state snapshot) and the dialogue/interaction boundary (presentation-only). Direction approved 2026-10-14; **not closed** | S14, S7, E16 |
| **R-13** (linked) | Historical character traits for named start figures (research-dependent; must respect uncertainty) | start-world content |

## 10. Non-goals

- No implementation; no `src/` or `tests/` change.
- No AI provider, model, or Jev implementation in this repository (ADR-0012).
- No rewrite of the delivered VS-4 character code.
- No free-form "social engine" outside the legal-action gate.
- No personality system that stores reputation as canonical truth.
