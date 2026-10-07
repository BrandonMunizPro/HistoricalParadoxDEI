import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import ts from 'typescript';

function isWithin(root: string, target: string): boolean {
  const path = relative(root, target);
  return path === '' || (path !== '..' && !path.startsWith('..' + sep) && !isAbsolute(path));
}

/** Test-only dependency guard; no module is loaded or executed. */
export function dependencyViolations(
  file: string,
  source: string,
  allowedRoots: readonly string[],
): string[] {
  const violations: string[] = [];
  const syntax = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  function checkSpecifier(specifier: string): void {
    if (!/^\.\.?[\\/]/.test(specifier) ||
        !allowedRoots.some((root) => isWithin(root, resolve(dirname(file), specifier)))) {
      violations.push('Dependency outside permitted layers: ' + specifier);
    }
  }
  function visit(node: ts.Node): void {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier &&
        ts.isStringLiteralLike(node.moduleSpecifier)) {
      checkSpecifier(node.moduleSpecifier.text);
    } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
      violations.push('CommonJS import is forbidden');
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) &&
               ts.isStringLiteralLike(node.argument.literal)) {
      checkSpecifier(node.argument.literal.text);
    } else if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        violations.push('Dynamic import is forbidden');
      } else if (ts.isIdentifier(node.expression) && node.expression.text === 'require') {
        violations.push('CommonJS require is forbidden');
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(syntax);
  return violations;
}
