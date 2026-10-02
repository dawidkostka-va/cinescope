import type { Locator } from '@playwright/test';

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** `boundingBox()` is nullable for detached elements; the specs only call it on visible ones. */
export async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Element has no bounding box');
  return box;
}

export function centerX(box: Box): number {
  return box.x + box.width / 2;
}

/**
 * The box of the rendered text inside an element — not of the element itself — so that a
 * full-width block with centred text and a centred inline element measure the same.
 */
export async function textBoxOf(locator: Locator): Promise<Box> {
  return locator.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const rect = range.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
}
