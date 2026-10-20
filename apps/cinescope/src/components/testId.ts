/**
 * Wraps a data-testid in a function call so it can be spread into a nested
 * MUI `slotProps` object without tripping TypeScript's excess-property
 * check on object literals (library slot prop types don't declare
 * `data-testid`, even though MUI forwards it to the DOM at runtime).
 */
export function dataTestId(id: string): { 'data-testid': string } {
  return { 'data-testid': id };
}
