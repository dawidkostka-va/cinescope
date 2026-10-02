import type { Page } from '@playwright/test';

/**
 * Intercepts `POST /reservations`.
 *
 * The suite never lets a reservation reach `json-server`: a real POST rewrites `db.json`,
 * and the next run would be checked against a fixture the specification does not describe.
 * `held` delays the response, for asserting on the in-flight state.
 */
export async function mockReservation(
  page: Page,
  status: number,
  held: Promise<void> = Promise.resolve(),
): Promise<void> {
  await page.route('**/reservations', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await held;
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(status === 201 ? { id: 1 } : { error: 'failed' }),
    });
  });
}

export async function unmockReservation(page: Page): Promise<void> {
  await page.unroute('**/reservations');
}

const MOVIES = '**/movies*';

/** Fails every request for the movie collection, for the error-state criterion. */
export async function failMovies(page: Page): Promise<void> {
  await page.route(MOVIES, (route) => route.abort('failed'));
}

/** Holds every movie request until the returned function is called. */
export async function holdMovies(page: Page): Promise<() => void> {
  const { held, release } = gate();
  await page.route(MOVIES, async (route) => {
    await held;
    await route.continue();
  });
  return release;
}

export async function restoreMovies(page: Page): Promise<void> {
  await page.unroute(MOVIES);
}

/** A promise with its resolver, for holding a mocked response open. */
export function gate(): { held: Promise<void>; release: () => void } {
  let release = (): void => undefined;
  const held = new Promise<void>((resolve) => (release = resolve));
  return { held, release };
}
