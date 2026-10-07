/**
 * Narrow read-only view of tactical reference data.
 *
 * Tactical catalogues hold a large amount of engine-specific structure. The
 * campaign domain and simulation must never receive those structures or keys.
 * These small summaries are for tactical adapter-side reference-data queries.
 *
 * Identifiers returned by this interface are opaque strings owned by the
 * tactical catalogue. They stay within the adapter/infrastructure boundary;
 * they are never exposed to campaign domain or simulation code (ADR-0001).
 */
export interface TacticalUnitSummary {
  /** Opaque catalogue identifier of a unit. */
  readonly unitKey: string;
  /** Opaque category identifier, when the catalogue resolves one. */
  readonly categoryKey: string | null;
  /** Opaque class identifier, when the catalogue resolves one. */
  readonly classKey: string | null;
}

/** Opaque catalogue identity of a faction. */
export interface TacticalFactionSummary {
  readonly factionKey: string;
}

/**
 * Read-only access to tactical reference data.
 *
 * Implementations belong in infrastructure (they may read the generated
 * research catalogues); consumers belong to tactical adapters. The simulation
 * depends only on domain contracts, never on this infrastructure interface.
 */
export interface TacticalCatalogReader {
  findUnit(unitKey: string): Promise<TacticalUnitSummary | null>;
  findFaction(factionKey: string): Promise<TacticalFactionSummary | null>;
  listBattlefieldKeys(): Promise<readonly string[]>;
}
