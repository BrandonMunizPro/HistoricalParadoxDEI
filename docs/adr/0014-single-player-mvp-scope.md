# ADR-0014: Single-player MVP scope

- Status: **Approved** (2026-10-04). Architectural boundary only.
- Date: 2026-10-04
- Amends framing in: [ADR-0008](0008-determinism-and-reproducibility.md), [ADR-0010](0010-persistence-and-repository-ports.md), assumption A-12
- Related: [../architecture/assumptions-and-open-decisions.md](../architecture/assumptions-and-open-decisions.md)

## Context

The MVP and the current architecture target **single player only**. Determinism
and reproducibility are still valuable, but their justification is local quality,
not network play.

## Decision

**Approved.** The MVP and the current architecture target **single player only**.
Determinism and reproducibility are still valuable, but their justification is
local quality, not network play.

1. **MVP is single player.** Multiplayer is explicitly out of scope and deferred
   until after a functioning single-player game exists.
2. **Not designed now, and not implied anywhere:** networking, lockstep
   simulation, multiplayer synchronisation, multiplayer pause semantics,
   multiplayer authority, rollback netcode, distributed ownership, or
   multiplayer persistence.
3. **Determinism and reproducibility are retained** for: debugging, testing,
   benchmarking, save/load, reproducing simulation bugs, causal explanation, and
   controlled scenario replay.
4. **No complexity is paid today for hypothetical multiplayer.** Architecture may
   avoid choices that would gratuitously prevent future multiplayer, but
   multiplayer is not an MVP requirement and must not drive design decisions.
5. **Future multiplayer** may be revisited after the single-player game works.
   That revisit is a separate design effort and may require new or amended ADRs.

## Consequences

- Determinism is treated as a reproducibility and debuggability property
  ([ADR-0008](0008-determinism-and-reproducibility.md)), not as a protocol
  requirement; determinism depth is chosen for local benefit.
- Persistence is local snapshot + causal ledger ([ADR-0010](0010-persistence-and-repository-ports.md));
  no distributed authority or sync concepts appear anywhere.
- No synchronisation seams, authority model or rollback machinery should be
  introduced "for later".

## Rejected alternatives

| Alternative | Why not |
| --- | --- |
| Designing networking/sync for hypothetical multiplayer | Pays complexity today for an unapproved feature |
| Lockstep or rollback groundwork "while we're here" | Same; also constrains simulation structure prematurely |
| Treating determinism as a networking requirement | Misstates its actual purpose |

## Unresolved

- **Unresolved:** conditions under which multiplayer should be revisited. This
  is deliberately not pre-planned.
