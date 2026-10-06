/**
 * Seeded random source seam (ADR-0008 determinism and reproducibility).
 *
 * E0 declares the seam only: draws must come from seeded, reproducible state,
 * never from ambient randomness. The algorithm and its seeding belong to the
 * epic that first needs random choice, which keeps E0 free of invented
 * mechanics while still forbidding unseeded randomness structurally.
 */
export interface SeededRandomSource {
  /**
   * The next deterministic draw as an unsigned 32-bit integer
   * (0..4294967295). Consecutive calls advance seeded state; two sources
   * created from the same seed produce the same sequence.
   */
  nextUint32(): number;
}
