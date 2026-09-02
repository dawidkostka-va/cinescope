import { expect, test } from '@playwright/test';
import { TOASTS } from './support/auditorium.js';
import { movies, screeningsOf } from './support/fixture.js';
import { failMovies } from './support/flows.js';
import { movieCard, routes, screeningButton, testIds } from './support/selectors.js';

test.describe('Movie list', () => {
  test('AC-01: / renders 5 movie cards, one per movie in db.json', async ({ page }) => {
    await page.goto(routes.movieList);
    await expect(page.getByTestId(testIds.movieList)).toBeVisible();
    await expect(page.getByTestId('movie-card')).toHaveCount(movies.length);
    for (const movie of movies) {
      await expect(movieCard(page, movie.id)).toBeVisible();
    }
  });

  test('AC-02: Each card shows title, genre, runtime in minutes and format (PL dubbing / PL subtitles)', async ({
    page,
  }) => {
    await page.goto(routes.movieList);
    for (const movie of movies) {
      const card = movieCard(page, movie.id);
      await expect(card.getByTestId(testIds.movieTitle)).toHaveText(movie.title);
      await expect(card.getByTestId(testIds.movieGenre)).toContainText(movie.genre);
      await expect(card.getByTestId(testIds.movieRuntime)).toContainText(
        String(movie.runtimeMinutes),
      );
      await expect(card.getByTestId(testIds.movieFormat)).toContainText(movie.format);
    }
  });

  test('AC-03: Each card renders one button per screening of that movie, labelled with the screening date and time', async ({
    page,
  }) => {
    await page.goto(routes.movieList);
    for (const movie of movies) {
      const card = movieCard(page, movie.id);
      const screenings = screeningsOf(movie.id);
      await expect(card.getByTestId('screening-button')).toHaveCount(screenings.length);
      for (const item of screenings) {
        const button = screeningButton(page, item.id);
        await expect(button).toContainText(item.time);
        await expect(button).toContainText(item.date);
      }
    }
  });

  test('AC-04: Clicking a screening button navigates to /screenings/:id/seats for that screening id', async ({
    page,
  }) => {
    await page.goto(routes.movieList);
    await screeningButton(page, 7).click();
    await expect(page).toHaveURL(new RegExp(`${routes.seats(7)}$`));
  });

  test('AC-49: While the movie request is in flight, / shows a loading indicator and no movie cards', async ({
    page,
  }) => {
    let release = (): void => undefined;
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route('**/movies*', async (route) => {
      await held;
      await route.continue();
    });

    await page.goto(routes.movieList);
    await expect(page.getByTestId(testIds.moviesLoading)).toBeVisible();
    await expect(page.getByTestId('movie-card')).toHaveCount(0);

    release();
    await expect(page.getByTestId('movie-card')).toHaveCount(movies.length);
    await expect(page.getByTestId(testIds.moviesLoading)).toBeHidden();
  });

  test('AC-50: When the movie request fails, / shows Failed to load movies and a Retry button that re-issues the request', async ({
    page,
  }) => {
    await failMovies(page);
    await page.goto(routes.movieList);

    await expect(page.getByTestId(testIds.moviesError)).toContainText(TOASTS.moviesFailed);
    await expect(page.getByTestId(testIds.moviesRetryButton)).toBeVisible();

    await page.unroute('**/movies*');
    await page.getByTestId(testIds.moviesRetryButton).click();
    await expect(page.getByTestId('movie-card')).toHaveCount(movies.length);
  });
});
