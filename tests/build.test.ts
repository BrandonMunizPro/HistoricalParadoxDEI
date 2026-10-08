import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = join(import.meta.dirname, '..');

describe('project builds', () => {
  it(
    'compiles the production sources with the build configuration',
    () => {
      const tsc = join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc');

      execFileSync(process.execPath, [tsc, '-p', 'tsconfig.build.json'], {
        cwd: repoRoot,
        stdio: 'pipe',
      });
      execFileSync(process.execPath, ['scripts/copy-migrations.mjs'], { cwd: repoRoot, stdio: 'pipe' });
      execFileSync(process.execPath, ['scripts/build-smoke.mjs'], { cwd: repoRoot, stdio: 'pipe' });

      expect(existsSync(join(repoRoot, 'dist', 'domain', 'battles', 'battle-adapter.js'))).toBe(true);
      expect(
        existsSync(join(repoRoot, 'dist', 'tactical', 'adapters', 'rome2-dei', 'rome2-dei-adapter.js')),
      ).toBe(true);
      expect(existsSync(join(repoRoot, 'dist', 'infrastructure', 'index.js'))).toBe(true);
      expect(existsSync(join(repoRoot, 'dist', 'persistence', 'migrations', 'meta', '_journal.json'))).toBe(true);
    },
    180_000,
  );
});
