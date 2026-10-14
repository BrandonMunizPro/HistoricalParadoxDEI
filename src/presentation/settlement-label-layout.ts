export interface ScreenRectangle {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
export interface SettlementLabelCandidate extends ScreenRectangle {
  readonly id: string;
  readonly tier: number;
  readonly selected: boolean;
}

export function settlementDetailBand(
  cameraDistance: number,
): 'far' | 'regional' | 'local' {
  return cameraDistance > 440
    ? 'far'
    : cameraDistance > 230
      ? 'regional'
      : 'local';
}

function overlaps(a: ScreenRectangle, b: ScreenRectangle): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/** Deterministic, priority-ordered placement with screen-space spatial buckets. */
export function layoutSettlementLabels(
  candidates: readonly SettlementLabelCandidate[],
  viewport: ScreenRectangle,
  blockers: readonly ScreenRectangle[],
  band: ReturnType<typeof settlementDetailBand>,
): readonly string[] {
  const sorted = [...candidates]
    .filter(
      (c) =>
        c.selected ||
        c.tier <= (band === 'far' ? 1 : band === 'regional' ? 2 : 4),
    )
    .sort(
      (a, b) =>
        Number(b.selected) - Number(a.selected) ||
        a.tier - b.tier ||
        a.id.localeCompare(b.id),
    );
  const buckets = new Map<string, ScreenRectangle[]>(),
    visible: string[] = [],
    cellSize = 96;
  function keys(rect: ScreenRectangle): string[] {
    const output = [];
    for (
      let x = Math.floor(rect.x / cellSize);
      x <= Math.floor((rect.x + rect.width) / cellSize);
      x++
    )
      for (
        let y = Math.floor(rect.y / cellSize);
        y <= Math.floor((rect.y + rect.height) / cellSize);
        y++
      )
        output.push(`${x}:${y}`);
    return output;
  }
  for (const c of sorted) {
    const rect = {
      x: c.x - 4,
      y: c.y - 3,
      width: c.width + 8,
      height: c.height + 6,
    };
    if (
      rect.x < viewport.x ||
      rect.y < viewport.y ||
      rect.x + rect.width > viewport.x + viewport.width ||
      rect.y + rect.height > viewport.y + viewport.height ||
      blockers.some((blocker) => overlaps(rect, blocker))
    )
      continue;
    const cells = keys(rect);
    if (
      cells.some((key) =>
        (buckets.get(key) ?? []).some((other) => overlaps(rect, other)),
      )
    )
      continue;
    visible.push(c.id);
    for (const key of cells) {
      const entries = buckets.get(key) ?? [];
      entries.push(rect);
      buckets.set(key, entries);
    }
  }
  return visible;
}
