import type { Locator, Page } from '@playwright/test';

/**
 * The specification lets a field's test id sit either on the native `<input>` or on the
 * UI-library component that wraps it (`mat-form-field`, `mat-checkbox`, MUI `TextField`,
 * …). These helpers resolve both to the native input, so the suite never depends on which
 * one the application chose.
 */
export function nativeInput(page: Page, testId: string): Locator {
  return page
    .locator(`input[data-testid="${testId}"], [data-testid="${testId}"] input:not([type="hidden"])`)
    .first();
}

export function nativeCheckbox(page: Page, testId: string): Locator {
  return page
    .locator(`input[type="checkbox"][data-testid="${testId}"], [data-testid="${testId}"] input[type="checkbox"]`)
    .first();
}

/** Types into a field, replacing its value, then leaves it — the way a customer would. */
export async function fillAndLeave(page: Page, testId: string, value: string): Promise<void> {
  const input = nativeInput(page, testId);
  await input.fill(value);
  await input.blur();
}

/** Focuses and leaves a field without typing, so it counts as left. */
export async function touch(page: Page, testId: string): Promise<void> {
  const input = nativeInput(page, testId);
  await input.focus();
  await input.blur();
}

/**
 * The visible text of a label, including CSS-generated content: Angular Material draws the
 * required asterisk with `::after`, MUI with a text node. Reads the closest `<label>` so a
 * test id on an inner span still sees the marker next to it.
 */
export async function renderedLabel(page: Page, testId: string): Promise<string> {
  return page.getByTestId(testId).first().evaluate((element) => {
    const root = element.closest('label') ?? element;
    const generated = (node: Element, pseudo: '::before' | '::after'): string => {
      const content = window.getComputedStyle(node, pseudo).content;
      return content === 'none' || content === 'normal' ? '' : content.replace(/^["']|["']$/g, '');
    };
    const parts: string[] = [];
    const walk = (node: Node): void => {
      if (node.nodeType === Node.TEXT_NODE) {
        parts.push(node.textContent ?? '');
        return;
      }
      if (!(node instanceof Element)) return;
      parts.push(generated(node, '::before'));
      node.childNodes.forEach(walk);
      parts.push(generated(node, '::after'));
    };
    walk(root);
    return parts.join('').replace(/\s+/g, ' ').trim();
  });
}
