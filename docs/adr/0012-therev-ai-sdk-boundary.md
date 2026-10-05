# ADR-0012: TheRev / Jev AI boundary

- Status: **Boundary approved** (ownership clarified 2026-10-04). SDK, transport,
  IPC and request/response schemas remain **Deferred**.
- Date: 2026-10-04
- Related: [ADR-0006](0006-legal-action-and-proposal-validation.md), [ADR-0014](0014-single-player-mvp-scope.md), blueprint §14

## Context

Jev is a reusable character and agent intelligence capability that lives in
**TheRev**, not in this repository. The game supplies structured character state,
knowledge, memories, relationships, concerns and a legal action space; external
intelligence reasons, interprets, converses and proposes intent. The simulation
validates intent and applies resulting world changes.

An earlier draft of this record could be read as though HistoricalGame owned AI
orchestration. It does not, and never will.

## Ownership (approved)

**Jev is not implemented inside the HistoricalGame repository.** Jev is
implemented in and exposed **through TheRev**.

TheRev is a separate platform/application. It is intended eventually to contain
an AI runtime/provider layer capable of connecting to local AI models, cloud AI
API providers, Jev models running locally, and further AI frameworks or providers
added later.

```
HistoricalGame
      │
      │  knowledge-filtered character / game context
      ▼
TheRev integration boundary                (owned by TheRev)
      │
      ▼
TheRev AI runtime / provider layer         (owned by TheRev)
      ├── local AI models
      ├── cloud AI APIs
      ├── Jev models running locally
      └── future AI frameworks / providers
      │
      ▼
structured dialogue / reasoning / proposed intent
      │
      ▼
HistoricalGame
      │
      ▼
ActionValidator                            (ADR-0006)
      │
      ▼
authoritative simulation                   (owner of canonical state)
```

### Division of responsibility

| Concern | Owner |
| --- | --- |
| AI provider registry, model manager, provider routing | **TheRev** |
| Local model installation, Ollama or other local runtime integration | **TheRev** |
| Cloud API credentials and provider capability negotiation | **TheRev** |
| Jev model hosting | **TheRev** |
| Launcher, marketplace, subscriptions, distribution, creator payouts, mod distribution | **TheRev** |
| Canonical world state | **HistoricalGame** |
| What a character is permitted to know | **HistoricalGame** |
| Knowledge-filtered context assembly | **HistoricalGame** |
| A stable game-side intelligence integration seam | **HistoricalGame** |
| Legality of proposed actions | **HistoricalGame** |

**HistoricalGame's responsibility is not provider orchestration.** It is to
maintain a stable, engine-agnostic game-side integration seam. Conceptually that
seam is something analogous to a `CharacterIntelligencePort`, but **the name and
API are not approved here** and must not be treated as settled.

The game must not care whether TheRev ultimately services a request using Jev,
Ollama, another local runtime, OpenAI, Gemini, Claude, another cloud provider, or
a future AI framework. That selection belongs to TheRev.

## AI authority rules (unchanged and approved)

1. The HistoricalGame TypeScript simulation owns canonical world state.
2. HistoricalGame determines what information a character is permitted to know.
3. Only knowledge-filtered context crosses the TheRev integration boundary.
4. TheRev/Jev/provider output cannot directly mutate canonical world state.
5. Any proposed world action must return through HistoricalGame's legal-action
   validation boundary ([ADR-0006](0006-legal-action-and-proposal-validation.md)).
6. Dialogue may lie, speculate, misunderstand, conceal, manipulate or repeat
   rumors when character state permits.
7. AI-generated statements do **not** automatically become world truth.
8. AI-generated proposed actions do **not** automatically become world actions.
9. The AI provider is never handed omniscient world state merely because the
   simulation possesses it.

Design principle: **TypeScript decides what happened. AI decides how a person
thinks or talks about what happened.** The simulation gives characters a life,
the event system gives them a history, the knowledge system gives them a
perspective, and Jev can give them a mind.

## Platform context (architectural context only, out of scope here)

TheRev is intended to evolve into a game/application launcher and platform
through which this game can run, potentially allowing launched games to use
local AI, cloud AI, Jev or other supported frameworks through a common platform
layer. HistoricalGame may become an early major consumer of that capability.

That platform is **out of scope** for HistoricalGame implementation.
HistoricalGame must not be designed around marketplace, monetization, launch or
distribution concerns.

## Design rule

> **Make sure the door exists. Do not build the building on the other side of
> the door in this repository.**

## Unresolved

- **Unresolved:** the SDK contract, transport, IPC mechanism, process boundary,
  request/response schema, streaming protocol and error protocol.
- **Unresolved:** the name and shape of the game-side intelligence port.
- **Unresolved:** permission model for what an agent may see and propose.
- **Unresolved:** how much strategic AI is deterministic/utility-based versus
  externally assisted.
- **Unresolved:** prompt/context budget and memory strategy for long-lived
  characters.

None of these may be implemented before integration work begins, and none may be
locked by this record.

## Rejected alternatives

| Alternative | Why not |
| --- | --- |
| Implement Jev inside HistoricalGame | Wrong repository; duplicates TheRev's purpose |
| HistoricalGame calls Ollama/OpenAI/Gemini/Claude directly | Couples the domain to providers; provider selection belongs to TheRev |
| HistoricalGame performs provider routing or credential management | Platform concern, explicitly out of scope |
| Give the AI provider the full world state and filter afterwards | Violates the knowledge boundary; leaks truth the character may not know |
| Lock an SDK now | Integration has not begun; premature and likely wrong |
