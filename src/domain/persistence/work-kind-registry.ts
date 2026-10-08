/**
 * Work-kind registry (ADR-0010, AD-9; E17a).
 *
 * The **explicit domain-side dispatch** that reconstructs paused scheduler
 * work without ever serializing a callback. Persistence records only the
 * scheduling envelope plus a `workKind` registration key and a JSON-safe
 * `payload`; campaign content registers a factory for each kind it can
 * schedule. On load, the driver asks the registry to rebuild `TWork` from the
 * payload and feeds the result back through `scheduler.schedule()`, so the
 * scheduler's own invariants re-validate (N-30, A13).
 *
 * This registry is pure domain code: no storage, no dispatch queue, no tactical
 * knowledge. It lives behind the persistence boundary so the scheduler itself
 * never learns about persistence.
 */
export type WorkKindFactory<TWork> = (payload: unknown) => TWork;

export interface WorkKindRegistry<TWork> {
  /**
   * Bind a factory to a stable kind key. Registering the same kind twice is a
   * composition error (it would silently change what a save means); it throws.
   */
  register(kind: string, factory: WorkKindFactory<TWork>): void;
  /** The currently registered kind keys, in registration order. */
  registeredKinds(): readonly string[];
  /**
   * Rebuild a work payload for `kind`. Throws a `RangeError` for a kind with
   * no registered factory, so a save referencing content this build cannot
   * dispatch fails loudly on load instead of silently inventing behavior.
   */
  reconstruct(kind: string, payload: unknown): TWork;
  /** True when a factory is registered for `kind`. */
  has(kind: string): boolean;
}

export function createWorkKindRegistry<TWork>(): WorkKindRegistry<TWork> {
  const factories = new Map<string, WorkKindFactory<TWork>>();
  const orderedKinds: string[] = [];

  return {
    register(kind: string, factory: WorkKindFactory<TWork>): void {
      if (typeof kind !== 'string' || kind.length === 0) {
        throw new RangeError('A work kind must be a nonempty primitive string (ADR-0010).');
      }
      if (factories.has(kind)) {
        throw new RangeError(
          `Work kind '${kind}' is already registered: registering it twice would change what a save means (ADR-0010).`,
        );
      }
      factories.set(kind, factory);
      orderedKinds.push(kind);
    },
    registeredKinds(): readonly string[] {
      return Object.freeze([...orderedKinds]);
    },
    reconstruct(kind: string, payload: unknown): TWork {
      const factory = factories.get(kind);
      if (factory === undefined) {
        throw new RangeError(
          `No work factory is registered for kind '${kind}': a save referencing unregistered content cannot be dispatched (ADR-0010).`,
        );
      }
      return factory(payload);
    },
    has(kind: string): boolean {
      return factories.has(kind);
    },
  };
}