# Cinema Booking App — Frozen Task Specification (Angular)

**Spec version:** 2.2
**Date:** 2026-09-02
**Variant:** Angular
**Paired variant:** `cinema-booking-app-spec-react.md` — the two files differ only in the
framework name and its four ecosystem equivalents (UI library, router, forms library,
scaffold tool). Every other byte, including the test-id contract and the criteria list, is
identical; both share the same `db.json`.
**Status:** frozen — do not edit between runs of the same study

| Part | Audience | Goes into the working directory? |
|---|---|---|
| Part 1 — Task prompt | the model | pasted as the prompt, verbatim |
| Part 2 — Scaffold contract | the person preparing the run | yes, as files |
| Part 3 — Acceptance criteria | the model (as part of the prompt) + evaluator | yes |
| Part 4 — Evaluator notes | evaluator only | **no** |
| Part 5 — E2E suite | evaluator only | **no** — run against the finished app |

---

## Part 1 — Task prompt (verbatim)

> Build a cinema seat-booking web application in Angular.
>
> The project scaffold is already in place: an empty Angular 22.1.6 CLI application with
> routing enabled, Angular Material installed and configured, `db.json` in the project root,
> and `json-server` available through `pnpm api` on `http://localhost:3000`. The package
> manager is pnpm — use `pnpm`, never `npm` or `yarn`. Do not change `db.json`. Do not add
> any further dependencies.
>
> Write all layout and seat-map styling yourself in SCSS; use Angular Material for buttons,
> form fields, dialogs and toasts, Angular's Reactive Forms for the checkout form, and the
> Angular Router for navigation. Use only Angular's built-in state mechanisms — do not add
> an external state management library.
>
> The application is desktop-only. Do not implement a mobile layout, and do not implement
> keyboard navigation or ARIA beyond what Angular Material gives you by default.
>
> All user-facing text is in English.
>
> Do not ask any questions. Every decision must follow from this specification alone; where
> it is silent, choose the simplest option that satisfies the criteria and move on.
>
> ### Project conventions
>
> - Every component uses external files — a separate `.html` template and a separate `.scss`
>   stylesheet. Do not use inline templates or inline styles.
> - `strictTemplates` is enabled. The project must type-check clean.
> - A strict ESLint configuration is already in place and is run with `pnpm lint`. Your code
>   must pass it with zero errors and zero warnings.
> - Write exactly one documentation file: `PLAN.md` in the project root, holding your plan of
>   work, kept current as you go. Do not write a README, notes, changelogs or any other
>   documentation file.
> - Use JSDoc comments only where the intent of a piece of code is not obvious from its
>   name and signature — for example the seat-identifier scheme or the couch price rule. Do
>   not document self-explanatory code.
>
> ### Screens
>
> Five routes:
>
> 1. `/` — movie list
> 2. `/screenings/:id/seats` — seat selection
> 3. `/screenings/:id/summary` — ticket summary
> 4. `/screenings/:id/checkout` — customer form
> 5. `/confirmation` — success
>
> The booking in progress is kept in `sessionStorage` and survives a page reload.
> Entering routes 2–5 without a booking in progress redirects to `/`.
>
> ### 1. Movie list (`/`)
>
> Movies are loaded from the API. While the request is in flight the view shows a loading
> indicator and no cards. If the request fails, the view shows the message
> `Failed to load movies` and a `Retry` button that re-issues the request.
>
> On success: a vertical list of movie cards. Each card shows the movie title, genre,
> runtime in minutes, and the audio/subtitle format — either `PL dubbing` or `PL subtitles`.
> Next to each movie, its screenings are rendered as buttons labelled with the screening
> date and time. Clicking a screening button navigates to `/screenings/:id/seats` for that
> screening.
>
> ### 2. Seat selection (`/screenings/:id/seats`)
>
> A representation of the screen (`SCREEN`) is drawn at the top of the view. The auditorium
> is drawn below it.
>
> **Auditorium geometry** — 15 rows, numbered 1 (closest to the screen, drawn directly under
> it) to 15 (farthest from the screen, drawn at the bottom). 24 seat columns, numbered 1 to
> 24 from left to right. Column numbering is global and identical in every row.
>
> There are two aisles, each two seats wide, rendered as empty unnumbered gaps: one between
> columns 4 and 5, one between columns 20 and 21. This gives three blocks: columns 1–4,
> columns 5–20, columns 21–24.
>
> In rows 1 to 10 the left block (columns 1–4) does not exist — that space is the entrance
> to the auditorium and contains no seats.
>
> The row number is displayed on both the left and the right edge of every row. Every seat
> displays its column number.
>
> **Seat types**
>
> - *Accessible seats* — row 1, columns 10 to 15. Six seats. Rendered in blue. They can be
>   selected by anyone and are priced like any other row 1 seat.
> - *Couches* — the whole of row 15. A couch spans two adjacent columns and is rendered as
>   one single wide element, visually distinct from a single seat. There are 12 couches in
>   row 15: columns 1–2, 3–4, 5–6, … 23–24. A couch is selected or deselected as a whole;
>   half a couch cannot be booked.
> - *Regular seats* — everything else.
>
> **Selection rules**
>
> - Clicking an available seat selects it; clicking a selected seat deselects it.
> - Unavailable seats cannot be selected.
> - A booking may cover at most 10 seats. A couch counts as 2 seats towards this limit.
> - When a click would exceed 10 seats, the click is ignored and a toast appears with the
>   text `Maximum 10 seats per booking`. Already selected seats stay clickable so they can
>   be deselected.
>
> **Legend** — displayed on this view, with these four entries and these colours:
>
> | Label | Colour |
> |---|---|
> | `Available` | `#2E7D32` |
> | `Selected` | `#F9A825` |
> | `Unavailable` | `#C62828` |
> | `Accessible` | `#1565C0` |
>
> Couches use the same green as available seats and are distinguished by shape.
>
> **Pricing** — a seat's price depends on its row:
>
> | Rows | Price |
> |---|---|
> | 1–5 | `25.00 PLN` |
> | 6–10 | `32.00 PLN` |
> | 11–15 | `39.00 PLN` |
>
> A couch is an exception: one couch costs `89.00 PLN` regardless of the two-seat rule.
>
> **Actions** — two buttons: `Cancel` returns to `/` and clears the selection; `Continue`
> navigates to `/screenings/:id/summary`. `Continue` does nothing when no seat is selected.
>
> The set of unavailable seats for a screening comes from `occupiedSeats` in the screening's
> data and is read once when the view is opened.
>
> ### 3. Summary (`/screenings/:id/summary`)
>
> A list of the selected tickets. Each row shows the movie title, the screening date and
> time, the row number, the seat description, and the price. A single seat is described as
> its column number; a couch is described as `Couch <a>-<b>` using its two column numbers.
>
> Below the list, a total: `Total: <sum> PLN`.
>
> Two buttons: `Back` returns to the seat selection with the selection intact, and `Confirm`
> navigates to `/screenings/:id/checkout`.
>
> ### 4. Checkout (`/screenings/:id/checkout`)
>
> A form with these fields:
>
> | Field | Required | Rule |
> |---|---|---|
> | First name | yes | at least 2 characters |
> | Last name | yes | at least 2 characters |
> | Email | yes | valid email address |
> | Confirm email | yes | must be identical to Email |
> | Phone number | no | if filled: exactly 9 digits |
> | I accept the terms and conditions | yes | must be checked |
>
> Field-level validation messages appear once a field has been blurred.
>
> The `Pay` button is always enabled. Clicking it while the form is invalid marks every
> field as touched, shows the validation messages, and shows a toast with the text
> `The form contains errors`. No navigation happens.
>
> Clicking `Pay` with a valid form sends `POST /reservations` to the API with the screening
> id, the selected seats and the customer data. The button shows a loading state while the
> request is in flight. On success the application navigates to `/confirmation`. On failure
> it stays on the form and shows a toast with the text `Payment failed. Please try again.`
>
> ### 5. Confirmation (`/confirmation`)
>
> A heading `Payment successful` and the text `Your tickets will be sent shortly to <email>`,
> where `<email>` is the address given in the form. One button, `Continue`, which navigates
> to `/` and clears the booking.
>
> ### Data
>
> `db.json` exposes `GET /movies`, `GET /screenings`, `GET /screenings/:id` and
> `POST /reservations`. A screening references its movie by `movieId` and carries `date`,
> `time` and `occupiedSeats`. Seats are identified as `R<row>C<column>`, for example
> `R7C12`; a couch occupies two such identifiers.
>
> ### Test hooks (mandatory)
>
> Every element listed below must carry the exact `data-testid` given, plus the listed data
> attributes. These attribute names and values are part of the contract — do not rename,
> abbreviate or add prefixes.
>
> | `data-testid` | Element | Extra attributes |
> |---|---|---|
> | `movie-list` | container of the movie cards | — |
> | `movies-loading` | loading indicator on `/` | — |
> | `movies-error` | error message on `/` | — |
> | `movies-retry-button` | `Retry` button on `/` | — |
> | `movie-card` | one movie card | `data-movie-id` |
> | `movie-title` | title inside a card | — |
> | `movie-genre` | genre inside a card | — |
> | `movie-runtime` | runtime inside a card | — |
> | `movie-format` | format inside a card | — |
> | `screening-button` | one screening button | `data-screening-id` |
> | `screen-indicator` | the `SCREEN` element | — |
> | `seat-map` | container of all rows | — |
> | `seat-row` | one row of the auditorium | `data-row` |
> | `row-label-left` | row number on the left edge | `data-row` |
> | `row-label-right` | row number on the right edge | `data-row` |
> | `aisle` | one aisle gap inside a row | `data-row` |
> | `seat` | one single seat | `data-row`, `data-column`, `data-state` |
> | `couch` | one couch | `data-row`, `data-column-start`, `data-column-end`, `data-state` |
> | `legend` | the legend container | — |
> | `legend-item` | one legend entry | `data-state` |
> | `toast` | any toast message | — |
> | `cancel-button` | `Cancel` on the seat view | — |
> | `continue-button` | `Continue` on the seat view | — |
> | `summary-list` | container of summary rows | — |
> | `summary-item` | one summary row | — |
> | `summary-item-title` | movie title in a summary row | — |
> | `summary-item-datetime` | date and time in a summary row | — |
> | `summary-item-row` | row number in a summary row | — |
> | `summary-item-seat` | seat description in a summary row | — |
> | `summary-item-price` | price in a summary row | — |
> | `summary-total` | the total line | — |
> | `back-button` | `Back` on the summary view | — |
> | `confirm-button` | `Confirm` on the summary view | — |
> | `first-name-input` | first name field | — |
> | `last-name-input` | last name field | — |
> | `email-input` | email field | — |
> | `confirm-email-input` | confirm email field | — |
> | `phone-input` | phone field | — |
> | `terms-checkbox` | terms checkbox | — |
> | `first-name-error` | first name validation message | — |
> | `last-name-error` | last name validation message | — |
> | `email-error` | email validation message | — |
> | `confirm-email-error` | confirm email validation message | — |
> | `phone-error` | phone validation message | — |
> | `terms-error` | terms validation message | — |
> | `pay-button` | `Pay` button | — |
> | `confirmation-heading` | `Payment successful` heading | — |
> | `confirmation-message` | the "tickets will be sent" line | — |
> | `confirmation-continue-button` | `Continue` on the confirmation view | — |
>
> `data-state` takes exactly one of: `available`, `selected`, `unavailable`, `accessible`.
> An accessible seat that is selected reports `selected`; an accessible seat that is taken
> reports `unavailable`.
>
> ### Tests
>
> Do not write any tests — no unit tests, no integration tests, no end-to-end tests, and no
> test tooling or configuration. The test suite is written separately by a person on the QA
> side, against the test hooks listed above; that is why those hooks are mandatory. Adding
> your own tests is out of scope.

---

## Part 2 — Scaffold contract

The working directory handed to the model contains, and only contains:

1. An Angular **22.1.6** CLI application, routing enabled, nothing else added. Package
   manager: **pnpm**.
2. CLI schematics frozen to external files — `"inlineTemplate": false`,
   `"inlineStyle": false`, `"style": "scss"` in `angular.json`.
3. `strictTemplates: true` in `tsconfig.json`, alongside `strict: true`,
   `noUncheckedIndexedAccess`, `noImplicitOverride` and `exactOptionalPropertyTypes`.
4. A strict ESLint setup: `typescript-eslint` `strict-type-checked` +
   `stylistic-type-checked`, plus `@angular-eslint` recommended, wired to `pnpm lint`,
   passing clean on the empty scaffold.
5. Angular Material, installed and configured (theme imported, animations enabled).
6. `json-server` in `devDependencies` and the script
   `"api": "json-server --watch db.json --port 3000"`.
7. `db.json` as described below.
8. No test runner, no README, no notes, no e2e directory, no Playwright, no git history
   beyond the single scaffold commit.

Both scaffolds are built by hand before the study and committed to the study repository, so
scaffold cost never enters the measured token count. The two scaffolds are prepared in the
same session, from the same checklist, and must be equivalent on every point above — same
TypeScript strictness, same lint severity, same style language, same package manager.

Playwright and the E2E suite (Part 5) are **not** in the working directory. They are added
by the evaluator after the run, in a copy of the finished project.

### `db.json`

Copied verbatim from `db.json` next to this specification. It is frozen: identical for
both variants and for every run.

---

## Part 3 — Acceptance criteria

Part of the prompt. 51 criteria, each binary.

### Movie list
- **AC-01** — `/` renders 5 movie cards, one per movie in `db.json`.
- **AC-02** — Each card shows title, genre, runtime in minutes and format (`PL dubbing` / `PL subtitles`).
- **AC-03** — Each card renders one button per screening of that movie, labelled with the screening date and time.
- **AC-04** — Clicking a screening button navigates to `/screenings/:id/seats` for that screening id.
- **AC-49** — While the movie request is in flight, `/` shows a loading indicator and no movie cards.
- **AC-50** — When the movie request fails, `/` shows `Failed to load movies` and a `Retry` button that re-issues the request.

### Auditorium geometry
- **AC-05** — The seat map has 15 rows, numbered 1 to 15, row 1 rendered directly under the screen.
- **AC-06** — Rows 11 to 15 contain 24 columns; rows 1 to 10 contain columns 5 to 24 only.
- **AC-07** — A two-seat-wide gap is rendered between columns 4 and 5 and between columns 20 and 21; gaps carry no seat and no number.
- **AC-08** — Column numbering is global 1–24 and identical across rows; in rows 1–10, numbering starts at 5.
- **AC-09** — The row number is rendered on both the left and the right edge of every row.
- **AC-10** — Every seat renders its column number.
- **AC-11** — A `SCREEN` indicator is rendered above row 1.
- **AC-12** — Row 1, columns 10 to 15 are accessible seats — 6 of them.
- **AC-13** — Row 15 renders 12 couches, each spanning two adjacent columns: 1–2, 3–4, … 23–24.
- **AC-14** — A couch is rendered as one wide element, visually distinct from a single seat.
- **AC-15** — The total number of selectable elements in the auditorium is 308 (200 seats in rows 1–10, 96 in rows 11–14, 12 couches in row 15).

### Seat selection
- **AC-16** — Seats listed in `occupiedSeats` for the screening are rendered unavailable and cannot be selected.
- **AC-17** — A couch is unavailable when either of its two seat identifiers is in `occupiedSeats`.
- **AC-18** — Clicking an available seat selects it; clicking it again deselects it.
- **AC-19** — Clicking a couch selects both of its seats as one unit; it cannot be half-selected.
- **AC-20** — Selection is capped at 10 seats; a couch counts as 2.
- **AC-21** — A click that would exceed 10 seats is ignored and shows the toast `Maximum 10 seats per booking`.
- **AC-22** — At the cap, already selected seats and couches can still be deselected.

### Legend and colours
- **AC-23** — The legend lists exactly `Available`, `Selected`, `Unavailable`, `Accessible`.
- **AC-24** — Available seats use `#2E7D32`.
- **AC-25** — Selected seats use `#F9A825`.
- **AC-26** — Unavailable seats use `#C62828`.
- **AC-27** — Accessible seats use `#1565C0`.

### Pricing
- **AC-28** — Seats in rows 1–5 cost `25.00 PLN`.
- **AC-29** — Seats in rows 6–10 cost `32.00 PLN`.
- **AC-30** — Seats in rows 11–14 cost `39.00 PLN`.
- **AC-31** — A couch costs `89.00 PLN` per couch, not per seat.
- **AC-32** — Accessible seats cost `25.00 PLN`, like the rest of row 1.

### Navigation from the seat map
- **AC-33** — `Cancel` navigates to `/` and clears the selection.
- **AC-34** — `Continue` navigates to `/screenings/:id/summary`.
- **AC-35** — `Continue` does nothing when no seat is selected.

### Summary
- **AC-36** — Each selected item is listed with movie title, screening date, time, row number, seat description and price.
- **AC-37** — A couch is described as `Couch <a>-<b>`; a single seat is described by its column number.
- **AC-38** — The total line reads `Total: <sum> PLN` and equals the sum of the listed prices.
- **AC-39** — `Back` returns to the seat map with the selection intact.
- **AC-40** — `Confirm` navigates to `/screenings/:id/checkout`.

### Checkout
- **AC-41** — The form renders first name, last name, email, confirm email, phone number and a terms checkbox.
- **AC-42** — First name and last name are required and must be at least 2 characters.
- **AC-43** — Email is required and must be a valid address; confirm email must match it.
- **AC-44** — Phone number is optional; when filled it must be exactly 9 digits.
- **AC-45** — The terms checkbox is required.
- **AC-46** — `Pay` is enabled at all times; clicking it on an invalid form marks all fields as touched, shows the messages and shows the toast `The form contains errors`, without navigating.
- **AC-47** — `Pay` on a valid form sends `POST /reservations`, shows a loading state, navigates to `/confirmation` on success, and on failure stays on the form and shows the toast `Payment failed. Please try again.`

### Confirmation and state
- **AC-48** — `/confirmation` shows `Payment successful` and `Your tickets will be sent shortly to <email>`; `Continue` navigates to `/` and clears the booking; the booking survives a reload via `sessionStorage`, and entering routes 2–5 without a booking redirects to `/`.

### Test hooks
- **AC-51** — Every `data-testid` and data attribute in the "Test hooks" table is present with the exact names and values given there.

---

## Part 4 — Evaluator notes (never placed in the working directory)

### Feature score
`working features / 51`, counted from Part 3. Qualification threshold per the methodology:
build succeeds **and** ≥ 80% of criteria pass, i.e. **≥ 41 / 51**.

### Reference arithmetic
- Rows 1–10: 20 seats each → 200
- Rows 11–14: 24 seats each → 96
- Row 15: 12 couches → 24 seats, 12 selectable units
- Physical seats: **320**. Selectable units: **308**.
- Max basket: 10 seats = 5 couches, or 10 single seats, or any mix counting a couch as 2.

### Cross-variant delta
Against `cinema-booking-app-spec-react.md`, the prompt differs only in the framework name
and its four first-party/ecosystem-standard equivalents:

| Concern | Angular | React |
|---|---|---|
| Version | Angular 22.1.6 | React 19 |
| UI components | Angular Material | MUI |
| Routing | Angular Router (in the CLI scaffold) | React Router |
| Forms and validation | Reactive Forms (built in) | React Hook Form |
| Scaffold tool | Angular CLI | Vite (TypeScript template) |

Held identical across both variants: pnpm, SCSS, external template and style files, strict
TypeScript (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`,
`exactOptionalPropertyTypes`), `typescript-eslint` `strict-type-checked` +
`stylistic-type-checked` at zero-warning tolerance, no test runner, one `PLAN.md` and no
other documentation.

Angular ships routing and forms in the framework; React does not. Handing React its
ecosystem standards keeps the two variants at the same level of "batteries provided".
Forcing React to hand-roll form validation would measure what the framework omits rather
than how the model writes the feature — a different study, worth running separately.

`db.json`, the test-id contract and Part 3 are byte-identical between the variants.

### Deliberate exclusions
Screen-vs-couch realism, seat locking on concurrent bookings, HTTP 409 handling, posters,
keyboard navigation, ARIA, mobile layout, i18n, external state libraries. A run that
implements these scores no extra; note it under quality only if it came at the cost of a
listed criterion.

---

## Part 5 — E2E suite (evaluator only)

**Tool:** Playwright, `@playwright/test`, Chromium only.

Written by hand **before** the first run, versioned in the study repository, identical for
both variants. It is the only automated check of the "features working / required" metric —
the model's own unit tests are not evidence about the model's own code.

**How it is run**

1. Copy the finished project out of the working directory.
2. Add `@playwright/test` and the suite to the copy — never to the working directory during
   the run.
3. `npm run api` on port 3000, `db.json` restored to its frozen state, application served on
   its default port.
4. `npx playwright test`, no retries, no code fixes.

**Configuration**

```ts
use: { testIdAttribute: 'data-testid' }
```

**Selectors** — the suite addresses the application exclusively through the test-id contract
in Part 1, never through text, CSS classes or DOM structure. Colour criteria (AC-24…AC-27)
are read as computed styles of `[data-testid="seat"][data-state="…"]`.

**Coverage** — one spec file per criteria group, one test per criterion, each test named
with its identifier (`AC-16: occupied seats are not selectable`). The suite reports
`passed / 51`, which is the feature score. The model writes no tests of its own, so this
suite is the sole source of the "features working / required" metric.

**Note on the frozen fixture** — the suite asserts against screening 1 unless a criterion
requires otherwise: it has occupied seats in rows 3, 6, 11 and one occupied couch
(`R15C5`+`R15C6`), which exercises AC-16, AC-17 and the row-price boundaries in a single
screening.
