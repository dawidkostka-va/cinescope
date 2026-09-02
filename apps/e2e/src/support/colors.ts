import type { Locator } from '@playwright/test';

/** The four colours the specification freezes for the seat map, as computed-style values. */
export const RGB = {
  available: 'rgb(46, 125, 50)',
  selected: 'rgb(249, 168, 37)',
  unavailable: 'rgb(198, 40, 40)',
  accessible: 'rgb(21, 101, 192)',
} as const;

/**
 * Collects the background colour of an element and of every descendant.
 *
 * The specification fixes the colour, not which node carries it: a seat may be a button
 * painted directly, or a wrapper around a painted span. Asserting on the subtree keeps the
 * suite from failing on an implementation detail it never specified.
 */
export async function backgroundColors(locator: Locator): Promise<string[]> {
  return locator.evaluate((element) =>
    [element, ...element.querySelectorAll('*')].map(
      (node) => window.getComputedStyle(node).backgroundColor,
    ),
  );
}

export async function paintedWith(locator: Locator, rgb: string): Promise<boolean> {
  return (await backgroundColors(locator)).includes(rgb);
}
