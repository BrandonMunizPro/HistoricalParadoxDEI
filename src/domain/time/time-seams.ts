/**
 * Seams declared by E0 for systems E1 and later epics will supply.
 *
 * A seam here is an interface only: no algorithm, no constant and no scale.
 * Each is deliberately unimplemented in E0 so that unresolved decisions
 * (N-29 calendar conversion, N-30 ordering key, seeded algorithm choice)
 * are not pre-empted by foundation code (ADR-0003 A3, A5; ADR-0008).
 */
import type { SimTime } from './sim-time.js';

/**
 * Calendar conversion seam (ADR-0003 A3, approved as a boundary).
 *
 * Calendar dates are derived mechanically as a pure function of the SimTime
 * scalar plus immutable authoritative scenario calendar data. E0 declares the
 * seam; E1 implements it when N-29 fixes the scale and conversion constant.
 * The date representation is a type parameter because its shape is E1's to
 * choose with that decision - E0 invents no calendar vocabulary.
 *
 * The calendar is authoritative scenario data, not a presentation cache and
 * not a rebuildable projection (A3).
 */
export interface ScenarioCalendar<TDate> {
  /** Pure conversion: absolute simulation time to scenario calendar date. */
  toCalendarDate(value: SimTime): TDate;
}

/**
 * Same-instant ordering seam (ADR-0003 A5, approved as a boundary).
 *
 * When multiple items are due at the same SimTime, a separate deterministic
 * ordering mechanism resolves them; ordering is never encoded into SimTime
 * itself. E0 declares the seam only: the final key shape is N-30 and belongs
 * to E1. Whatever key type E1 chooses, the mechanism must be total,
 * deterministic, stable, and independent of wall-clock timing, hash iteration
 * order, presentation and fidelity tier (A5).
 */
export type SameInstantOrderKey<TWork, TKey> = (work: TWork) => TKey;
