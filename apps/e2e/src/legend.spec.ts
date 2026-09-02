import { expect, test } from '@playwright/test';
import { ACCESSIBLE } from './support/auditorium.js';
import { paintedWith, RGB } from './support/colors.js';
import { freeSeat, openSeatMap, selectSeat } from './support/flows.js';
import { seat, testIds } from './support/selectors.js';

test.beforeEach(async ({ page }) => {
  await openSeatMap(page);
});

test.describe('Legend and colours', () => {
  test('AC-23: The legend lists exactly Available, Selected, Unavailable, Accessible', async ({
    page,
  }) => {
    const legend = page.getByTestId(testIds.legend);
    await expect(legend).toBeVisible();
    await expect(legend.getByTestId(testIds.legendItem)).toHaveCount(4);
    for (const [state, label] of [
      ['available', 'Available'],
      ['selected', 'Selected'],
      ['unavailable', 'Unavailable'],
      ['accessible', 'Accessible'],
    ] as const) {
      await expect(
        legend.locator(`[data-testid="${testIds.legendItem}"][data-state="${state}"]`),
      ).toContainText(label);
    }
  });

  test('AC-24: Available seats use #2E7D32', async ({ page }) => {
    expect(await paintedWith(seat(page, 7, freeSeat(7)), RGB.available)).toBe(true);
  });

  test('AC-25: Selected seats use #F9A825', async ({ page }) => {
    const column = freeSeat(7);
    await selectSeat(page, 7, column);
    expect(await paintedWith(seat(page, 7, column), RGB.selected)).toBe(true);
  });

  test('AC-26: Unavailable seats use #C62828', async ({ page }) => {
    // R3C7 is occupied in the fixture for the default screening.
    expect(await paintedWith(seat(page, 3, 7), RGB.unavailable)).toBe(true);
  });

  test('AC-27: Accessible seats use #1565C0', async ({ page }) => {
    expect(
      await paintedWith(seat(page, ACCESSIBLE.row, ACCESSIBLE.columns.from), RGB.accessible),
    ).toBe(true);
  });
});
