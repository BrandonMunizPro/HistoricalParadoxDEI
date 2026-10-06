/**
 * SHA-1 (FIPS 180-4) message digest, implemented directly in the domain layer.
 *
 * This exists solely to derive canonical identity per ADR-0009 5a, which
 * specifies RFC 4122 UUIDv5 - a name-based, SHA-1-derived identifier. SHA-1 is
 * used here as a non-adversarial naming hash for collision resistance, never
 * for security: no attacker-controlled input is involved, so its cryptographic
 * weaknesses are irrelevant to this purpose. See ADR-0009 5a for why the
 * representation was approved.
 *
 * A dependency-free, domain-local implementation is required because the
 * domain layer may import only its own modules (see tests/domain-purity), and
 * the repository has no runtime dependencies (N-28r).
 */

/** Left-rotate a 32-bit word. */
function rotateLeft(value: number, bits: number): number {
  return (value << bits) | (value >>> (32 - bits));
}

/**
 * Compute the 20-byte SHA-1 digest of `message`.
 *
 * Deterministic and pure: identical input bytes always produce identical
 * output bytes, with no wall-clock, randomness or state involved.
 */
export function sha1Digest(message: Uint8Array): Uint8Array {
  const messageLength = message.length;
  // Pad to 512-bit blocks: message, 0x80, zeros, then a 64-bit big-endian
  // bit-length trailer.
  const paddedLength = (((messageLength + 8) >> 6) + 1) << 6;
  const block = new Uint8Array(paddedLength);
  block.set(message);
  block[messageLength] = 0x80;

  const bitLength = messageLength * 8;
  const paddedView = new DataView(block.buffer);
  paddedView.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false);
  paddedView.setUint32(paddedLength - 4, bitLength >>> 0, false);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  const words = new Uint32Array(80);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let t = 0; t < 16; t += 1) {
      const index = offset + t * 4;
      words[t] =
        ((block[index] ?? 0) << 24) |
        ((block[index + 1] ?? 0) << 16) |
        ((block[index + 2] ?? 0) << 8) |
        (block[index + 3] ?? 0);
    }
    for (let t = 16; t < 80; t += 1) {
      words[t] = rotateLeft(
        (words[t - 3] ?? 0) ^ (words[t - 8] ?? 0) ^ (words[t - 14] ?? 0) ^ (words[t - 16] ?? 0),
        1,
      );
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let t = 0; t < 80; t += 1) {
      let f: number;
      let k: number;
      if (t < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (t < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (t < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }
      const next = (rotateLeft(a, 5) + f + e + k + (words[t] ?? 0)) | 0;
      e = d;
      d = c;
      c = rotateLeft(b, 30);
      b = a;
      a = next;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
  }

  const digest = new Uint8Array(20);
  const digestView = new DataView(digest.buffer);
  digestView.setUint32(0, h0 >>> 0, false);
  digestView.setUint32(4, h1 >>> 0, false);
  digestView.setUint32(8, h2 >>> 0, false);
  digestView.setUint32(12, h3 >>> 0, false);
  digest[16] = (h4 >>> 24) & 0xff;
  digest[17] = (h4 >>> 16) & 0xff;
  digest[18] = (h4 >>> 8) & 0xff;
  digest[19] = h4 & 0xff;
  return digest;
}
