/**
 * WorkClassRank (ADR-0003 amendment B2, N-30).
 *
 * The scheduler total order is lexicographic ascending
 * `dueSimTime -> workClassRank -> workIdentifier`. This rank is the **only
 * static semantic precedence axis**: values are domain-owned, **append-only
 * and never renumbered**, so ordering stays stable across runs, saves and
 * process boundaries.
 *
 * `battleResult` occupies the **first precedence class**: encounter/battle
 * result application resolves before incompatible remaining work at one
 * instant. In this slice it exists purely as a **scheduling fixture** proving
 * that class behaviour; battle content, tactical integration and battle
 * resolution belong to later slices.
 */
export enum WorkClassRank {
  /** First precedence: encounter/battle result application. */
  battleResult = 0,
  /** All other scheduled consequences. */
  world = 1,
}

/** Ordinal of a rank inside the static axis; used by the total order. */
export function workClassRankOrder(rank: WorkClassRank): number {
  return rank;
}

/**
 * Runtime gate for the scheduling envelope (amendment B2/N-30, ADR-0008).
 *
 * Only declared, domain-owned ranks are part of the static axis. The rank is
 * a number-typed enum, so at runtime any value could be passed; anything that
 * is not one of the declared members would fall outside the append-only
 * precedence axis and silently reorder history. The scheduler rejects such
 * values **before mutating any state**.
 */
export function requireDeclaredWorkClassRank(rank: WorkClassRank): WorkClassRank {
  if (rank !== WorkClassRank.battleResult && rank !== WorkClassRank.world) {
    throw new RangeError(
      `Work class rank must be a declared domain-owned member (battleResult or world), received ${String(rank)}: undeclared ranks are outside the static precedence axis (ADR-0003 amendment B2).`,
    );
  }
  return rank;
}
