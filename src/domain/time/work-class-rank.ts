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
