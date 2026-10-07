import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dependencyViolations } from './helpers/architecture-dependencies.js';

const repoRoot = join(import.meta.dirname, '..');
const domainRoot = join(repoRoot, 'src', 'domain');

function listTypeScriptFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return listTypeScriptFiles(full);
    return entry.name.endsWith('.ts') ? [full] : [];
  });
}

const domainFiles = listTypeScriptFiles(domainRoot);

/** Engine-specific vocabulary that must never appear in the domain layer. */
const forbiddenPatterns: readonly { label: string; pattern: RegExp }[] = [
  { label: 'Rome II reference', pattern: /rome\s*2|rome2|tw:?rome/i },
  { label: 'Divide et Impera reference', pattern: /\bdei\b|divide\s+et\s+impera/i },
  { label: 'catalogue implementation detail', pattern: /catalog/i },
  { label: 'Lua reference', pattern: /\blua\b/i },
  { label: 'XML/scenario reference', pattern: /\.xml\b|scenario\s+file/i },
  { label: 'pack file reference', pattern: /packfile|\.pack\b|packfile/i },
  { label: 'filesystem path', pattern: /[A-Za-z]:[\\/]|\/(?:home|usr|etc)\// },
  { label: 'research artefact path', pattern: /research[\\/]/ },
  { label: 'tactical key mapping', pattern: /\b(?:unit|faction|region|settlement)_key\b/ },
  { label: 'JavaScript date API', pattern: /\bnew Date\s*\(|\bDate\.(?:now|parse)\b/ },
  {
    label: 'ambient randomness or wall clock',
    pattern: /\bMath\.random\b|\brandomUUID\b|\bperformance\.now\b/,
  },
  {
    label: 'AI provider vocabulary',
    pattern: /\b(?:openai|anthropic|ollama|langchain|huggingface|llm|gpt|claude)\b/i,
  },
  {
    label: 'real-world rate vocabulary',
    pattern:
      /\b(?:miles?|kilometers?|leagues?|furlongs?|km\/h|mph)\b|\bper\s+(?:hour|day|week|month|year)\b/i,
  },
];

describe('domain purity', () => {
  it('has domain sources to check', () => {
    expect(domainFiles.length).toBeGreaterThan(0);
  });

  it.each(forbiddenPatterns)('contains no $label', ({ pattern }) => {
    const offenders = domainFiles
      .filter((file) => pattern.test(readFileSync(file, 'utf8')))
      .map((file) => relative(repoRoot, file));
    expect(offenders).toEqual([]);
  });

  it.each([
    { layer: 'domain', root: domainRoot, allowedRoots: [domainRoot] },
    { layer: 'simulation', root: join(repoRoot, 'src', 'simulation'),
      allowedRoots: [domainRoot, join(repoRoot, 'src', 'simulation')] },
  ])('$layer dependencies stay within the approved layers', ({ root, allowedRoots }) => {
    const files = listTypeScriptFiles(root);
    expect(files.length).toBeGreaterThan(0);
    const offenders = files.flatMap((file) =>
      dependencyViolations(file, readFileSync(file, 'utf8'), allowedRoots)
        .map((violation) => relative(repoRoot, file) + ': ' + violation),
    );
    expect(offenders).toEqual([]);
  });

  it('identity derivation has no wall-clock or ambient randomness entry points', () => {
    // ADR-0009 5: canonical identity must not depend on wall-clock time,
    // ambient randomness, database identity or mutable display data.
    const identityRoot = join(domainRoot, 'identity');
    const files = listTypeScriptFiles(identityRoot);
    expect(files.length).toBeGreaterThan(0);
    const forbidden =
      /\bDate\.now\b|\bMath\.random\b|\bnew Date\b|\brandomUUID\b|\bperformance\.now\b|\bsetTimeout\b|\bsetInterval\b|\bcrypto\.random/;
    const offenders = files
      .filter((file) => forbidden.test(readFileSync(file, 'utf8')))
      .map((file) => relative(repoRoot, file));
    expect(offenders).toEqual([]);
  });

  it('time module declares no scale constant and no unit vocabulary', () => {
    // N-29: the fixed-point scale and calendar conversion constant belong to
    // E1. E0 must not smuggle a ticks-per-unit value, rate or unit word into
    // the time primitives (ADR-0003 A2, A14).
    const timeRoot = join(domainRoot, 'time');
    const files = listTypeScriptFiles(timeRoot);
    expect(files.length).toBeGreaterThan(0);
    const offenders: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
      // Numeric literals only: digits not bound to words or hyphens, so that
      // an ADR citation inside an error message does not count as a scale.
      if (/(?<![\w-])\d{2,}(?![\w-])/.test(code)) {
        offenders.push(`${relative(repoRoot, file)}: multi-digit numeric literal`);
      }
      const unit = code.match(/\b(?:millisecond|second|minute|hour|day|week|month|year)s?\b/i);
      if (unit) {
        offenders.push(`${relative(repoRoot, file)}: unit vocabulary '${unit[0]}'`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
