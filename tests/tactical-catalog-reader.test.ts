import { describe, expect, it } from 'vitest';
import {
  JsonTacticalCatalogReader,
  type TacticalCatalogReader,
} from '../src/infrastructure/index.js';
import { NotImplementedError } from '../src/shared/not-implemented-error.js';

describe('TacticalCatalogReader', () => {
  it('exposes only narrow queries and keeps the catalogue root in infrastructure', () => {
    const reader: TacticalCatalogReader = new JsonTacticalCatalogReader({
      catalogRoot: 'research/rome2-dei/catalogs',
    });

    expect((reader as JsonTacticalCatalogReader).catalogRoot).toBe('research/rome2-dei/catalogs');
  });

  it('is not implemented yet', async () => {
    const reader = new JsonTacticalCatalogReader({ catalogRoot: 'research/rome2-dei/catalogs' });

    await expect(reader.findUnit('any')).rejects.toBeInstanceOf(NotImplementedError);
    await expect(reader.findFaction('any')).rejects.toBeInstanceOf(NotImplementedError);
    await expect(reader.listBattlefieldKeys()).rejects.toBeInstanceOf(NotImplementedError);
  });
});
