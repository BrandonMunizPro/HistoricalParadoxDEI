import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

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

  it('imports nothing outside the domain layer', () => {
    const offenders: string[] = [];

    for (const file of domainFiles) {
      const source = readFileSync(file, 'utf8');
      const specifiers = [...source.matchAll(/from\s+'([^']+)'/g)].map((match) => match[1] ?? '');
      const foreign = specifiers.filter((specifier) => !specifier.startsWith('./'));
      if (foreign.length > 0) {
        offenders.push(`${relative(repoRoot, file)}: ${foreign.join(', ')}`);
      }
      expect(source).not.toMatch(/\brequire\s*\(/);
      expect(source).not.toMatch(/\bimport\s*\(/);
    }

    expect(offenders).toEqual([]);
  });
});
