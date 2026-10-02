/**
 * The browser clock is frozen at this instant for every test (see `utils/test.ts`), so the
 * day picker is deterministic against the static fixture: Tuesday 15 September 2026.
 */
export const TIMEZONE = 'Europe/Warsaw';
export const NOW = new Date('2026-09-15T09:00:00+02:00');

/** The five day buttons for {@link NOW}: `Today` then the next four weekdays. */
export const DAY_BUTTONS = [
  { date: '2026-09-15', label: 'Today' },
  { date: '2026-09-16', label: 'Wednesday' },
  { date: '2026-09-17', label: 'Thursday' },
  { date: '2026-09-18', label: 'Friday' },
  { date: '2026-09-19', label: 'Saturday' },
] as const;

export const TODAY = DAY_BUTTONS[0].date;
/** A day button whose day has screenings of only some movies (3 and 5). */
export const PARTIAL_DAY = '2026-09-19';
/** A day button whose day has no screenings at all. */
export const EMPTY_DAY = '2026-09-18';
/** Reachable only through the datepicker or the URL — beyond the five buttons. */
export const LATER_DAY = '2026-09-20';
export const PAST_DAY = '2026-09-14';
