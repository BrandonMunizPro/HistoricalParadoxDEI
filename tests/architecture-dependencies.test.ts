import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dependencyViolations } from './helpers/architecture-dependencies.js';

const repoRoot = join(import.meta.dirname, '..');
const domainRoot = join(repoRoot, 'src', 'domain');
const simulationRoot = join(repoRoot, 'src', 'simulation');
const domainFile = join(domainRoot, 'time', 'fixture.ts');
const simulationFile = join(simulationRoot, 'systems', 'fixture.ts');

const staticForms = [
  'import { value } from "SPECIFIER";',
  "import value from 'SPECIFIER';",
  'import * as values from "SPECIFIER";',
  'import type { Value } from "SPECIFIER";',
  'import "SPECIFIER";',
  "import 'SPECIFIER';",
  'export { value } from "SPECIFIER";',
  "export * from 'SPECIFIER';",
  'export * as values from "SPECIFIER";',
  'export type { Value } from "SPECIFIER";',
  'export type * from "SPECIFIER";',
  'type Value = import("SPECIFIER").Value;',
];

describe('architecture dependency guard fixtures', () => {
  it.each(staticForms)('recognizes dependencies in %s', (form) => {
    for (const specifier of ['node:fs', 'typescript', './../../infrastructure/index.js', './../../domain-extra/index.js']) {
      expect(dependencyViolations(domainFile, form.replace('SPECIFIER', specifier), [domainRoot]))
        .toHaveLength(1);
    }
    for (const specifier of ['./sim-time.js', '../identity/index.js', './../time/sim-time.js']) {
      expect(dependencyViolations(domainFile, form.replace('SPECIFIER', specifier), [domainRoot]))
        .toEqual([]);
    }
  });

  it.each(staticForms)('enforces simulation dependencies in %s', (form) => {
    for (const specifier of ['../../infrastructure/index.js', '../../tactical/index.js', '../../shared/not-implemented-error.js', 'node:fs', '../../domain-extra/index.js']) {
      expect(dependencyViolations(simulationFile, form.replace('SPECIFIER', specifier), [domainRoot, simulationRoot]))
        .toHaveLength(1);
    }
    for (const specifier of ['../../domain/time/index.js', '../index.js', './local.js']) {
      expect(dependencyViolations(simulationFile, form.replace('SPECIFIER', specifier), [domainRoot, simulationRoot]))
        .toEqual([]);
    }
  });

  it.each([
    'const value = require("../identity/index.js");',
    'import value = require("../identity/index.js");',
    'const value = import("../identity/index.js");',
  ])('rejects runtime loading and CommonJS: %s', (source) => {
    expect(dependencyViolations(domainFile, source, [domainRoot])).toHaveLength(1);
  });

  it('ignores comments, ordinary strings and local exports', () => {
    const source = [
      '// import value from "node:fs";',
      '/* export * from "node:fs"; */',
      "const example = 'import \"node:fs\"; require(\"node:fs\")';",
      'export { example };',
    ].join('\n');
    expect(dependencyViolations(domainFile, source, [domainRoot])).toEqual([]);
  });
});
