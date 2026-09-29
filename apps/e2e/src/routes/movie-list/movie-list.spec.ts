import { DAY_BUTTONS, EMPTY_DAY, LATER_DAY, PARTIAL_DAY, PAST_DAY, TODAY } from '../../mocks/clock.js';
import { movies, moviesOn, screeningsOn } from '../../mocks/fixture.js';
import { TEXTS } from '../../mocks/messages.js';
import { expectPresent, expectWithAttributes } from '../../utils/identifiers.js';
import { failMovies, holdMovies, restoreMovies } from '../../utils/network.js';
import { routes, testIds, urlOf } from '../../utils/selectors.js';
import { expect, test } from '../../utils/test.js';
import {
  chooseDay,
  dayButton,
  dayButtons,
  movieCard,
  movieCards,
  openMovieList,
  renderedMovieIds,
  screeningButton,
  selectedDayButtons,
} from './movie-list.utils.js';

test.describe('Movie list — /', () => {
  test('AC-01: Without a chosen date, / shows today\'s screenings: one movie card per movie with a screening today', async ({
    page,
  }) => {
    await openMovieList(page);
    await expect(page.getByTestId(testIds.movieList)).toBeVisible();
    const expected = moviesOn(TODAY);
    expect(expected).toHaveLength(movies.length);
    await expect(movieCards(page)).toHaveCount(expected.length);
    expect(await renderedMovieIds(page)).toEqual(expected.map((movie) => movie.id));
  });

  test('AC-02: Each card shows title, genre, runtime in minutes and format (PL dubbing / PL subtitles)', async ({
    page,
  }) => {
    await openMovieList(page);
    for (const movie of moviesOn(TODAY)) {
      const card = movieCard(page, movie.id);
      await expect(card.getByTestId(testIds.movieTitle)).toHaveText(movie.title);
      await expect(card.getByTestId(testIds.movieGenre)).toContainText(movie.genre);
      await expect(card.getByTestId(testIds.movieRuntime)).toContainText(
        `${String(movie.runtimeMinutes)} min`,
      );
      await expect(card.getByTestId(testIds.movieFormat)).toContainText(movie.format);
    }
  });

  test('AC-03: Each card renders one button per screening of that movie on the selected day, labelled with the screening time (HH:mm), ordered by time', async ({
    page,
  }) => {
    await openMovieList(page);
    for (const movie of moviesOn(TODAY)) {
      const expected = screeningsOn(TODAY, movie.id);
      const buttons = movieCard(page, movie.id).getByTestId(testIds.screeningButton);
      await expect(buttons).toHaveText(expected.map((item) => item.time));
      expect(
        await buttons.evaluateAll((nodes) =>
          nodes.map((node) => Number(node.getAttribute('data-screening-id'))),
        ),
      ).toEqual(expected.map((item) => item.id));
    }
  });

  test('AC-04: Clicking a screening button navigates to /screenings/:id/seats for that screening id', async ({
    page,
  }) => {
    await openMovieList(page);
    await chooseDay(page, '2026-09-16');
    await screeningButton(page, 7).click();
    await expect(page).toHaveURL(urlOf(routes.seats(7)));
  });

  test('AC-49: While the movie request is in flight, / shows a loading indicator and no movie cards', async ({
    page,
  }) => {
    const release = await holdMovies(page);
    await page.goto(routes.movieList);
    await expect(page.getByTestId(testIds.moviesLoading)).toBeVisible();
    await expect(movieCards(page)).toHaveCount(0);

    release();
    await expect(movieCards(page)).toHaveCount(moviesOn(TODAY).length);
    await expect(page.getByTestId(testIds.moviesLoading)).toHaveCount(0);
  });

  test('AC-50: When the movie request fails, / shows Failed to load movies and a Retry button that re-issues the request', async ({
    page,
  }) => {
    await failMovies(page);
    await page.goto(routes.movieList);

    await expect(page.getByTestId(testIds.moviesError)).toContainText(TEXTS.moviesFailed);
    await expect(page.getByTestId(testIds.moviesRetryButton)).toBeVisible();

    await restoreMovies(page);
    await page.getByTestId(testIds.moviesRetryButton).click();
    await expect(movieCards(page)).toHaveCount(moviesOn(TODAY).length);
  });

  test('AC-51: Every movie-list identifier in section 9.1 is present with the exact names and values given there', async ({
    page,
  }) => {
    const release = await holdMovies(page);
    await page.goto(routes.movieList);
    await expectPresent(page, [testIds.moviesLoading]);
    release();

    await expectPresent(page, [
      testIds.dayPicker,
      testIds.dayButton,
      testIds.datePicker,
      testIds.movieList,
      testIds.movieCard,
      testIds.movieTitle,
      testIds.movieGenre,
      testIds.movieRuntime,
      testIds.movieFormat,
      testIds.screeningButton,
    ]);
    await expectWithAttributes(page, testIds.dayButton, ['data-date', 'data-selected']);
    await expectWithAttributes(page, testIds.movieCard, ['data-movie-id']);
    await expectWithAttributes(page, testIds.screeningButton, ['data-screening-id']);

    await chooseDay(page, EMPTY_DAY);
    await expectPresent(page, [testIds.moviesEmpty]);

    await failMovies(page);
    await page.reload();
    await expectPresent(page, [testIds.moviesError, testIds.moviesRetryButton]);
  });

  test('AC-52: Above the movie list, the day picker shows Today and the next four days by English weekday name, followed by a datepicker; Today is selected by default', async ({
    page,
  }) => {
    await openMovieList(page);
    const buttons = dayButtons(page);
    await expect(buttons).toHaveCount(DAY_BUTTONS.length);
    for (const [index, { date, label }] of DAY_BUTTONS.entries()) {
      await expect(buttons.nth(index), label).toHaveAttribute('data-date', date);
      await expect(buttons.nth(index), label).toHaveText(label);
    }

    await expect(selectedDayButtons(page)).toHaveCount(1);
    await expect(dayButton(page, TODAY)).toHaveAttribute('data-selected', 'true');

    const picker = page.getByTestId(testIds.datePicker).first();
    await expect(picker).toBeVisible();
    const pickerFollowsButtons = await page
      .getByTestId(testIds.dayPicker)
      .evaluate((container) => {
        const last = [...container.querySelectorAll('[data-testid="day-button"]')].at(-1);
        const picker = container.querySelector('[data-testid="date-picker"]');
        return Boolean(
          last && picker && last.compareDocumentPosition(picker) & Node.DOCUMENT_POSITION_FOLLOWING,
        );
      });
    expect(pickerFollowsButtons, 'datepicker inside the day picker, after the day buttons').toBe(true);

    const pickerBox = await page.getByTestId(testIds.dayPicker).boundingBox();
    const listBox = await page.getByTestId(testIds.movieList).boundingBox();
    expect(pickerBox && listBox && pickerBox.y + pickerBox.height <= listBox.y + 1).toBe(true);
  });

  test('AC-53: Choosing another day shows only the movies with a screening on that day, each with only that day\'s screenings', async ({
    page,
  }) => {
    await openMovieList(page);
    await chooseDay(page, PARTIAL_DAY);
    await expect(dayButton(page, TODAY)).toHaveAttribute('data-selected', 'false');

    const expected = moviesOn(PARTIAL_DAY);
    expect(expected.length).toBeLessThan(movies.length);
    await expect(movieCards(page)).toHaveCount(expected.length);
    expect(await renderedMovieIds(page)).toEqual(expected.map((movie) => movie.id));
    for (const movie of expected) {
      await expect(movieCard(page, movie.id).getByTestId(testIds.screeningButton)).toHaveText(
        screeningsOn(PARTIAL_DAY, movie.id).map((item) => item.time),
      );
    }
  });

  test('AC-54: A day without screenings shows No screenings on this day and no movie cards', async ({
    page,
  }) => {
    await openMovieList(page);
    await chooseDay(page, EMPTY_DAY);
    await expect(page.getByTestId(testIds.moviesEmpty)).toContainText(TEXTS.moviesEmpty);
    await expect(movieCards(page)).toHaveCount(0);

    await chooseDay(page, TODAY);
    await expect(page.getByTestId(testIds.moviesEmpty)).toHaveCount(0);
    await expect(movieCards(page)).toHaveCount(moviesOn(TODAY).length);
  });

  test('AC-55: The selected day is kept in the URL as ?date=YYYY-MM-DD; opening such a URL selects that day, and a missing, invalid or past date selects today', async ({
    page,
  }) => {
    await openMovieList(page);
    await chooseDay(page, PARTIAL_DAY);
    await expect(page).toHaveURL(new RegExp(`[?&]date=${PARTIAL_DAY}(&|$)`));

    // A day beyond the five buttons, as the datepicker would choose it.
    await openMovieList(page, LATER_DAY);
    await expect(selectedDayButtons(page)).toHaveCount(0);
    await expect(movieCards(page)).toHaveCount(moviesOn(LATER_DAY).length);
    expect(await renderedMovieIds(page)).toEqual(moviesOn(LATER_DAY).map((movie) => movie.id));

    await openMovieList(page, PARTIAL_DAY);
    await expect(dayButton(page, PARTIAL_DAY)).toHaveAttribute('data-selected', 'true');
    await expect(movieCards(page)).toHaveCount(moviesOn(PARTIAL_DAY).length);

    for (const fallback of [PAST_DAY, 'not-a-date']) {
      await openMovieList(page, fallback);
      await expect(dayButton(page, TODAY), fallback).toHaveAttribute('data-selected', 'true');
      await expect(movieCards(page), fallback).toHaveCount(moviesOn(TODAY).length);
    }
  });
});
