/**
 * Error raised by code that deliberately has no implementation yet.
 *
 * Used by boundary scaffolding (adapter and catalogue shells) so that calling an
 * unimplemented stage fails loudly and names the missing stage, instead of
 * silently doing nothing.
 */
export class NotImplementedError extends Error {
  constructor(what: string) {
    super(`${what} is not implemented yet.`);
    this.name = 'NotImplementedError';
  }
}
