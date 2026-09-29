import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const SUITE_FIXTURE = new URL('./mocks/db.json', import.meta.url);
const BACKEND_FIXTURE = new URL('../../../db.json', import.meta.url);

function read(url: URL): unknown {
  return JSON.parse(readFileSync(fileURLToPath(url), 'utf8'));
}

/**
 * Refuses to run the suite when its fixture differs from the workspace `db.json` served by
 * `pnpm api`. The two are separate files on purpose; if they drift, every criterion is
 * measured against data the application never received and nothing else reports it.
 */
export default function globalSetup(): void {
  if (isDeepStrictEqual(read(SUITE_FIXTURE), read(BACKEND_FIXTURE))) return;
  throw new Error(
    'apps/e2e/src/mocks/db.json differs from the workspace db.json. Make them identical before running the suite.',
  );
}
