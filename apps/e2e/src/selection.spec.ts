import { test } from '@playwright/test';

test.describe('Seat selection', () => {
  test.fixme('AC-16: Seats listed in occupiedSeats for the screening are rendered unavailable and cannot be selected', () => {
    // assertions written in the next step
  });

  test.fixme('AC-17: A couch is unavailable when either of its two seat identifiers is in occupiedSeats', () => {
    // assertions written in the next step
  });

  test.fixme('AC-18: Clicking an available seat selects it; clicking it again deselects it', () => {
    // assertions written in the next step
  });

  test.fixme('AC-19: Clicking a couch selects both of its seats as one unit; it cannot be half-selected', () => {
    // assertions written in the next step
  });

  test.fixme('AC-20: Selection is capped at 10 seats; a couch counts as 2', () => {
    // assertions written in the next step
  });

  test.fixme('AC-21: A click that would exceed 10 seats is ignored and shows the toast Maximum 10 seats per booking', () => {
    // assertions written in the next step
  });

  test.fixme('AC-22: At the cap, already selected seats and couches can still be deselected', () => {
    // assertions written in the next step
  });
});
