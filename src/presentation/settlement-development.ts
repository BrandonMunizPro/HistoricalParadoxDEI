/** Presentation input proposal only. An application adapter must supply authoritative state later. */
export type DevelopmentCategory =
  | 'military'
  | 'civic'
  | 'religious'
  | 'commercial'
  | 'agricultural'
  | 'maritime';
export interface DevelopmentSnapshot {
  readonly settlementId: string;
  readonly revision: string;
  readonly structures: readonly {
    readonly id: string;
    readonly category: DevelopmentCategory;
    readonly level: number;
    readonly condition: 'active' | 'ruined';
  }[];
}
export interface ArchitecturalContext {
  readonly settlementId: string;
  readonly culture: 'latin' | 'greek' | 'italic';
  readonly yearBce: number;
  readonly tier: number;
  readonly geography: readonly ('coastal' | 'hill' | 'cultivable')[];
}
export interface ArchitecturalAsset {
  readonly id: string;
  readonly category: DevelopmentCategory;
  readonly culture: ArchitecturalContext['culture'];
  readonly fromBce: number;
  readonly toBce: number;
  readonly minimumLevel: number;
  readonly maximumTier: number;
  readonly requires: readonly ArchitecturalContext['geography'][number][];
}
const categories: readonly DevelopmentCategory[] = [
  'military',
  'civic',
  'religious',
  'commercial',
  'agricultural',
  'maritime',
];
export const architecturalCatalog: readonly ArchitecturalAsset[] = (
  ['latin', 'greek', 'italic'] as const
).flatMap((culture) =>
  categories.map((category) => ({
    id: `${culture}.${category}.republican`,
    category,
    culture,
    fromBce: 400,
    toBce: 200,
    minimumLevel: 1,
    maximumTier: 4,
    requires:
      category === 'maritime'
        ? (['coastal'] as const)
        : category === 'agricultural'
          ? (['cultivable'] as const)
          : [],
  })),
);
export interface SelectedArchitecturalAsset {
  readonly structureId: string;
  readonly assetId: string;
  readonly category: DevelopmentCategory;
  readonly condition: 'active' | 'ruined';
  readonly variant: number;
}

/** No costs, build progression, ownership, demographics or inferred structures. */
export function selectArchitecturalAssets(
  context: ArchitecturalContext,
  snapshot: DevelopmentSnapshot,
  catalog: readonly ArchitecturalAsset[] = architecturalCatalog,
): readonly SelectedArchitecturalAsset[] {
  if (
    snapshot.settlementId !== context.settlementId ||
    !snapshot.revision ||
    !Number.isFinite(context.yearBce) ||
    !Number.isInteger(context.tier) ||
    context.tier < 1 ||
    context.tier > 4
  )
    throw new RangeError('Invalid development context');
  const ids = new Set<string>();
  for (const s of snapshot.structures) {
    if (
      !s.id ||
      ids.has(s.id) ||
      !categories.includes(s.category) ||
      !Number.isInteger(s.level) ||
      s.level < 1 ||
      !['active', 'ruined'].includes(s.condition)
    )
      throw new RangeError('Invalid development structure');
    ids.add(s.id);
  }
  return [...snapshot.structures]
    .sort((a, b) => a.id.localeCompare(b.id, 'en'))
    .flatMap((s) => {
      const asset = catalog
        .filter(
          (a) =>
            a.category === s.category &&
            a.culture === context.culture &&
            context.yearBce <= a.fromBce &&
            context.yearBce >= a.toBce &&
            s.level >= a.minimumLevel &&
            context.tier <= a.maximumTier &&
            a.requires.every((r) => context.geography.includes(r)),
        )
        .sort(
          (a, b) =>
            b.minimumLevel - a.minimumLevel || a.id.localeCompare(b.id, 'en'),
        )[0];
      if (!asset) return [];
      let hash = 2166136261;
      for (const c of `${context.settlementId}/${s.id}/${asset.id}`)
        hash = Math.imul(hash ^ c.charCodeAt(0), 16777619) >>> 0;
      return [
        {
          structureId: s.id,
          assetId: asset.id,
          category: s.category,
          condition: s.condition,
          variant: hash % 4,
        },
      ];
    });
}
