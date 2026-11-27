# 01: Movie list and day picker

**What to build:** A customer opens `/`, picks a day with the day picker (five day buttons and a datepicker), and sees the movies playing that day with their screening times, loaded from the backend, with loading, error and empty states. The selected day lives in the URL. Clicking a screening opens its seat map route. Also sets up the five routes from section 3 (screens 2–5 may be empty placeholders for now) and the redirect of unknown URLs to `/`.

**Specification:** sections 1, 2, 3 (routes), 3.3, 4, 9.1.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] AC-01 — Without a chosen date, `/` shows today's screenings: one movie card per movie with a screening today.
- [x] AC-02 — Each card shows title, genre, runtime in minutes and format (`PL dubbing` / `PL subtitles`).
- [x] AC-03 — Each card renders one button per screening of that movie on the selected day, labelled with the screening time (`HH:mm`), ordered by time.
- [x] AC-04 — Clicking a screening button navigates to `/screenings/:id/seats` for that screening id.
- [x] AC-49 — While the movie request is in flight, `/` shows a loading indicator and no movie cards.
- [x] AC-50 — When the movie request fails, `/` shows `Failed to load movies` and a `Retry` button that re-issues the request.
- [x] AC-52 — Above the movie list, the day picker shows `Today` and the next four days by English weekday name, followed by a datepicker; `Today` is selected by default.
- [x] AC-53 — Choosing another day shows only the movies with a screening on that day, each with only that day's screenings.
- [x] AC-54 — A day without screenings shows `No screenings on this day` and no movie cards.
- [x] AC-55 — The selected day is kept in the URL as `?date=YYYY-MM-DD`; opening such a URL selects that day, and a missing, invalid or past date selects today.
- [x] AC-51 — Every movie-list identifier in section 9.1 is present with the exact names and values given there.
