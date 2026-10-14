/** World-scale interchange and distances; renderer origins never define identity. */
export interface GeographicCoordinate {
  readonly lon: number;
  readonly lat: number;
}

export interface GeographicBounds {
  readonly west: number;
  readonly east: number;
  readonly south: number;
  readonly north: number;
}

/** Local azimuthal equidistant map in metres, rebased to the active render view. */
export function projectLocalMapMetres(
  point: GeographicCoordinate,
  origin: GeographicCoordinate,
): { readonly east: number; readonly north: number } {
  geographicDistanceMetres(point, origin);
  const r = Math.PI / 180,
    phi = point.lat * r,
    phi0 = origin.lat * r,
    dl = (point.lon - origin.lon) * r;
  const c = Math.acos(
    Math.max(
      -1,
      Math.min(
        1,
        Math.sin(phi0) * Math.sin(phi) +
          Math.cos(phi0) * Math.cos(phi) * Math.cos(dl),
      ),
    ),
  );
  const k = c < 1e-10 ? 1 : c / Math.sin(c);
  if (Math.PI - c < 1e-7)
    throw new RangeError('Antipode is outside a local map view');
  return {
    east: 6371008.8 * k * Math.cos(phi) * Math.sin(dl),
    north:
      6371008.8 *
      k *
      (Math.cos(phi0) * Math.sin(phi) -
        Math.sin(phi0) * Math.cos(phi) * Math.cos(dl)),
  };
}

export function unprojectLocalMapMetres(
  east: number,
  north: number,
  origin: GeographicCoordinate,
): GeographicCoordinate {
  if (!Number.isFinite(east) || !Number.isFinite(north))
    throw new RangeError('Invalid local position');
  const rho = Math.hypot(east, north),
    c = rho / 6371008.8,
    r = Math.PI / 180,
    phi0 = origin.lat * r;
  if (c >= Math.PI) throw new RangeError('Position outside local map view');
  if (rho < 1e-8) return { ...origin };
  const lat =
    Math.asin(
      Math.cos(c) * Math.sin(phi0) +
        (north * Math.sin(c) * Math.cos(phi0)) / rho,
    ) / r;
  const lon =
    origin.lon +
    Math.atan2(
      east * Math.sin(c),
      rho * Math.cos(phi0) * Math.cos(c) - north * Math.sin(phi0) * Math.sin(c),
    ) /
      r;
  return { lon: ((lon + 540) % 360) - 180, lat };
}

export function containsCoordinate(
  bounds: GeographicBounds,
  point: GeographicCoordinate,
): boolean {
  return (
    Number.isFinite(point.lon) &&
    Number.isFinite(point.lat) &&
    point.lon >= bounds.west &&
    point.lon <= bounds.east &&
    point.lat >= bounds.south &&
    point.lat <= bounds.north
  );
}

/** Spherical great-circle distance for data QA; not an army travel duration. */
export function geographicDistanceMetres(
  a: GeographicCoordinate,
  b: GeographicCoordinate,
): number {
  if (
    ![a.lon, a.lat, b.lon, b.lat].every(Number.isFinite) ||
    Math.abs(a.lat) > 90 ||
    Math.abs(b.lat) > 90 ||
    Math.abs(a.lon) > 180 ||
    Math.abs(b.lon) > 180
  )
    throw new RangeError('Invalid coordinate');
  const r = Math.PI / 180,
    dlat = (b.lat - a.lat) * r,
    dlon = (b.lon - a.lon) * r;
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dlon / 2) ** 2;
  return 6371008.8 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

/** Local east/north/up double-precision view of WGS84 ECEF. Rebase per active tile. */
export function toLocalTangentMetres(
  point: GeographicCoordinate,
  origin: GeographicCoordinate,
): { readonly east: number; readonly north: number; readonly up: number } {
  geographicDistanceMetres(point, origin);
  const r = Math.PI / 180,
    a = 6378137,
    e2 = 0.00669437999014;
  function ecef(p: GeographicCoordinate): readonly [number, number, number] {
    const lat = p.lat * r,
      lon = p.lon * r,
      n = a / Math.sqrt(1 - e2 * Math.sin(lat) ** 2);
    return [
      n * Math.cos(lat) * Math.cos(lon),
      n * Math.cos(lat) * Math.sin(lon),
      n * (1 - e2) * Math.sin(lat),
    ];
  }
  const p = ecef(point),
    o = ecef(origin),
    x = p[0] - o[0],
    y = p[1] - o[1],
    z = p[2] - o[2],
    lat = origin.lat * r,
    lon = origin.lon * r;
  return {
    east: -Math.sin(lon) * x + Math.cos(lon) * y,
    north:
      -Math.sin(lat) * Math.cos(lon) * x -
      Math.sin(lat) * Math.sin(lon) * y +
      Math.cos(lat) * z,
    up:
      Math.cos(lat) * Math.cos(lon) * x +
      Math.cos(lat) * Math.sin(lon) * y +
      Math.sin(lat) * z,
  };
}
