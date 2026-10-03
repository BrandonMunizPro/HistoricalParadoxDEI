/**
 * A battle that a tactical engine has accepted and turned into something it can
 * resolve. `handle` is opaque to the domain: only the adapter that produced it
 * may interpret it.
 */
export interface PreparedBattle {
  /** Identifier of the battle this preparation belongs to. */
  readonly battleId: string;
  /** Opaque, adapter-owned reference to the prepared engagement. */
  readonly handle: string;
}
