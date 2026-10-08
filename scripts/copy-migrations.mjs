import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The drizzle migrator resolves its migrations folder at runtime relative to
// the built module (dist/persistence). The .sql files and journal are static
// assets that tsc does not emit, so the build copies them verbatim into the
// dist layout (H7 / AD-9).
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(repoRoot, 'src', 'persistence', 'migrations');
const target = join(repoRoot, 'dist', 'persistence', 'migrations');

mkdirSync(join(target, '..'), { recursive: true });
cpSync(source, target, { recursive: true });