/**
 * Narrow read-only view of tactical reference data.
 *
 * Tactical catalogues hold a large amount of engine-specific structure. The
 * domain must never receive those structures directly, so everything the
 * simulation is allowed to ask for is expressed here as small summaries.
 *
 * Identifiers returned by this interface are opaque strings owned by the
 * tactical catalogue. They are never parsed or interpreted by domain code.
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
 * research catalogues); consumers belong to the simulation.
 */
export interface TacticalCatalogReader {
  findUnit(unitKey: string): Promise<TacticalUnitSummary | null>;
  findFaction(factionKey: string): Promise<TacticalFactionSummary | null>;
  listBattlefieldKeys(): Promise<readonly string[]>;
}
