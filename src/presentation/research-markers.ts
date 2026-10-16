import { WORLD_RENDER_BOUNDS } from './world-navigation.js';
/** Presentation references only. Never canonical settlement definitions or simulation state. */
export interface ResearchLocation {
  readonly id: string;
  readonly name: string;
  readonly lon: number;
  readonly lat: number;
  readonly uncertainty: 'approximate' | 'disputed';
  readonly note: string;
  readonly referenceIds: readonly string[];
  readonly alternateNames: readonly string[];
  readonly sources: readonly string[];
}
export interface ResearchInput {
  readonly proposedId: string;
  readonly historicalName: string;
  readonly coordinates: {
    readonly lon: number | null;
    readonly lat: number | null;
    readonly precision?: string;
  } | null;
  readonly locationConfidence?: string;
  readonly presence278Bce?: string;
  readonly identityConfidence?: string;
  readonly alternateNames?: readonly string[];
  readonly sources?: readonly string[];
  readonly pleiadesId?: string;
}
export function researchLocations(records: readonly ResearchInput[]): {
  locations: ResearchLocation[];
  excluded: { id: string; reason: string }[];
  duplicates: { id: string; primary: string; reason: string }[];
  possibleDuplicates: { ids: readonly string[]; reason: string }[];
} {
  const locations: ResearchLocation[] = [],
    excluded: { id: string; reason: string }[] = [],
    seen = new Set<string>(),
    duplicates: { id: string; primary: string; reason: string }[] = [],
    possibleDuplicates: { ids: readonly string[]; reason: string }[] = [],
    exact = new Map<string, number>();
  for (const r of records) {
    const c = r.coordinates;
    let reason = '';
    if (!c) reason = 'No coordinates';
    else if (c.lon === null || c.lat === null)
      reason = 'Missing coordinate components';
    else if (
      !Number.isFinite(c.lon) ||
      !Number.isFinite(c.lat) ||
      c.lon < -180 ||
      c.lon > 180 ||
      c.lat < -90 ||
      c.lat > 90
    )
      reason = 'Invalid coordinates';
    else if (
      c.lon < WORLD_RENDER_BOUNDS.west ||
      c.lon > WORLD_RENDER_BOUNDS.east ||
      c.lat < WORLD_RENDER_BOUNDS.south ||
      c.lat > WORLD_RENDER_BOUNDS.north
    )
      reason = 'Outside current rendering coverage';
    else if (seen.has(r.proposedId)) reason = 'Duplicate research handle';
    if (reason || !c || c.lon === null || c.lat === null) {
      excluded.push({ id: r.proposedId, reason });
      continue;
    }
    seen.add(r.proposedId);
    // Only identical named representative points are consolidated here. This
    // removes repeated research representations, not disputed identifications.
    const key = `${r.historicalName.normalize('NFKC').toLowerCase().trim()}|${c.lon}|${c.lat}`;
    const previous = r.sources?.length ? exact.get(key) : undefined;
    const uncertain = r.locationConfidence === 'uncertain' ||
      r.identityConfidence === 'uncertain' || r.presence278Bce === 'uncertain' ||
      r.presence278Bce === 'unlocated';
    if (previous !== undefined) {
      const old = locations[previous]!;
      duplicates.push({ id: r.proposedId, primary: old.id, reason: 'Identical name and representative coordinates; reference handles retained' });
      locations[previous] = { ...old,
        referenceIds: [...old.referenceIds, r.proposedId],
        alternateNames: [...new Set([...old.alternateNames, ...(r.alternateNames ?? [])])],
        sources: [...new Set([...old.sources, ...(r.sources ?? [])])],
        uncertainty: uncertain ? 'disputed' : old.uncertainty,
      };
      continue;
    }
    if (r.sources?.length) exact.set(key, locations.length);
    locations.push({
      id: `research:${r.proposedId}`,
      name: r.historicalName,
      lon: c.lon,
      lat: c.lat,
      uncertainty:
        uncertain
          ? 'disputed'
          : 'approximate',
      note: `Unapproved research reference; not verified for 278 BCE. ${c.precision ?? 'Representative location; coordinate precision unverified.'}`,
      referenceIds: [r.proposedId],
      alternateNames: r.alternateNames ?? [],
      sources: r.sources ?? [],
    });
  }
  for (let i = 0; i < locations.length; i++) for (let j = i + 1; j < locations.length; j++) {
    const a = locations[i]!, b = locations[j]!;
    const km = Math.hypot((a.lon-b.lon)*Math.cos(a.lat*Math.PI/180), a.lat-b.lat)*111.195;
    if (km < 1 || (a.name.toLowerCase() === b.name.toLowerCase() && km < 50))
      possibleDuplicates.push({ids:[a.id,b.id],reason:'Nearby or co-located references; distinct records retained pending identity review'});
  }
  return { locations, excluded, duplicates, possibleDuplicates };
}
export interface ScreenResearchLocation {
  readonly location: ResearchLocation;
  readonly x: number;
  readonly y: number;
}
export interface ResearchCluster {
  readonly x: number;
  readonly y: number;
  readonly members: readonly ResearchLocation[];
}
/** Screen cells bound marker density at every zoom; no geographic identities are merged. */
export function clusterResearchLocations(
  points: readonly ScreenResearchLocation[],
  width: number,
  height: number,
  enabled: boolean,
  cellSize = 64,
  limit = 180,
): ResearchCluster[] {
  if (!enabled) return [];
  if (cellSize <= 0 || !Number.isFinite(cellSize) || limit < 0)
    throw new RangeError('Invalid clustering budget');
  const cells = new Map<string, ScreenResearchLocation[]>();
  for (const p of [...points].sort((a, b) =>
    a.location.id.localeCompare(b.location.id),
  )) {
    if (
      !Number.isFinite(p.x) ||
      !Number.isFinite(p.y) ||
      p.x < 0 ||
      p.y < 0 ||
      p.x >= width ||
      p.y >= height
    )
      continue;
    const key = `${Math.floor(p.x / cellSize)}:${Math.floor(p.y / cellSize)}`;
    const cell = cells.get(key) ?? [];
    cell.push(p);
    cells.set(key, cell);
  }
  return [...cells.values()]
    .sort(
      (a, b) =>
        b.length - a.length ||
        a[0]!.location.id.localeCompare(b[0]!.location.id),
    )
    .slice(0, limit)
    .map((cell) => ({
      x: cell.reduce((s, p) => s + p.x, 0) / cell.length,
      y: cell.reduce((s, p) => s + p.y, 0) / cell.length,
      members: cell.map((p) => p.location),
    }));
}
