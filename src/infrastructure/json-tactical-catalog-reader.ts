import { NotImplementedError } from '../shared/not-implemented-error.js';
import type {
  TacticalCatalogReader,
  TacticalFactionSummary,
  TacticalUnitSummary,
} from './tactical-catalog-reader.js';

export interface JsonTacticalCatalogReaderOptions {
  /**
   * Directory holding the generated tactical catalogues. The completed research
   * output lives in `research/rome2-dei/catalogs` and is generated locally, not
   * tracked in Git.
   */
  readonly catalogRoot: string;
}

/**
 * Catalogue reader shell backed by the generated research catalogues.
 *
 * It records where the catalogues live and refuses to answer any query yet: no
 * loading, caching, indexing or unit resolution is implemented. Keeping the
 * shell unimplemented prevents the large catalogue schema from leaking into
 * domain types before the design decides what the simulation actually needs.
 */
export class JsonTacticalCatalogReader implements TacticalCatalogReader {
  readonly #catalogRoot: string;

  constructor(options: JsonTacticalCatalogReaderOptions) {
    this.#catalogRoot = options.catalogRoot;
  }

  /** Directory this reader was configured with. */
  get catalogRoot(): string {
    return this.#catalogRoot;
  }

  findUnit(_unitKey: string): Promise<TacticalUnitSummary | null> {
    return Promise.reject(new NotImplementedError('JsonTacticalCatalogReader.findUnit'));
  }

  findFaction(_factionKey: string): Promise<TacticalFactionSummary | null> {
    return Promise.reject(new NotImplementedError('JsonTacticalCatalogReader.findFaction'));
  }

  listBattlefieldKeys(): Promise<readonly string[]> {
    return Promise.reject(new NotImplementedError('JsonTacticalCatalogReader.listBattlefieldKeys'));
  }
}
