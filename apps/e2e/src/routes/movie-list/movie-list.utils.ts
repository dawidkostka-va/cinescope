import type { Locator, Page } from '@playwright/test';
import { byTestId, routes, testIds } from '../../utils/selectors.js';
import { expect } from '../../utils/test.js';

export async function openMovieList(page: Page, date?: string): Promise<void> {
  await page.goto(date === undefined ? routes.movieList : routes.movieListOn(date));
  await expect(page.getByTestId(testIds.dayPicker)).toBeVisible();
}

export function movieCards(page: Page): Locator {
  return page.getByTestId(testIds.movieCard);
}

export function movieCard(page: Page, movieId: number): Locator {
  return byTestId(page, testIds.movieCard, { 'movie-id': movieId });
}

export function screeningButton(page: Page, screeningId: number): Locator {
  return byTestId(page, testIds.screeningButton, { 'screening-id': screeningId });
}

export function dayButtons(page: Page): Locator {
  return page.getByTestId(testIds.dayButton);
}

export function dayButton(page: Page, date: string): Locator {
  return byTestId(page, testIds.dayButton, { date });
}

export function selectedDayButtons(page: Page): Locator {
  return byTestId(page, testIds.dayButton, { selected: true });
}

/** Clicks a day button and waits for it to become the selected one. */
export async function chooseDay(page: Page, date: string): Promise<void> {
  await dayButton(page, date).click();
  await expect(dayButton(page, date)).toHaveAttribute('data-selected', 'true');
}

/** Movie ids of the rendered cards, in page order. */
export async function renderedMovieIds(page: Page): Promise<number[]> {
  return movieCards(page).evaluateAll((nodes) =>
    nodes.map((node) => Number(node.getAttribute('data-movie-id'))),
  );
}
