import { test } from '@playwright/test';

test.describe('Movie list', () => {
  test.fixme('AC-01: / renders 5 movie cards, one per movie in db.json', () => {
    // assertions written in the next step
  });

  test.fixme('AC-02: Each card shows title, genre, runtime in minutes and format (PL dubbing / PL subtitles)', () => {
    // assertions written in the next step
  });

  test.fixme('AC-03: Each card renders one button per screening of that movie, labelled with the screening date and time', () => {
    // assertions written in the next step
  });

  test.fixme('AC-04: Clicking a screening button navigates to /screenings/:id/seats for that screening id', () => {
    // assertions written in the next step
  });

  test.fixme('AC-49: While the movie request is in flight, / shows a loading indicator and no movie cards', () => {
    // assertions written in the next step
  });

  test.fixme('AC-50: When the movie request fails, / shows Failed to load movies and a Retry button that re-issues the request', () => {
    // assertions written in the next step
  });
});
