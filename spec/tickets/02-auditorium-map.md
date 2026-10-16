# 02: Auditorium map

**What to build:** `/screenings/:id/seats` loads the screening and its movie and draws the page header (title, show date, seat-limit text), the `SCREEN` bar and the auditorium: 15 rows with row labels on both edges, both aisles in every row, the entrance gap in rows 1–10, accessible seats in row 1 and 12 couches in row 15. Occupied seats are shown as unavailable. Selection comes in ticket 03. An unknown screening id redirects to `/`.

**Specification:** sections 3.3, 5 (intro and layout), 5.1, 5.3 (colours of available, unavailable and accessible seats), 9.2, 9.7.

**Blocked by:** 01 — Movie list and day picker.

**Status:** ready

- [x] AC-05 — The seat map has 15 rows, numbered 1 to 15, row 1 rendered directly under the screen.
- [x] AC-06 — Rows 11 to 15 contain 24 columns; rows 1 to 10 contain columns 5 to 24 only.
- [x] AC-07 — A two-seat-wide gap is rendered between columns 4 and 5 and between columns 20 and 21 in every row; gaps carry no seat and no number.
- [x] AC-08 — Column numbering is global 1–24 and identical across rows; in rows 1–10, numbering starts at 5.
- [x] AC-09 — The row number is rendered on both the left and the right edge of every row.
- [x] AC-10 — Every seat renders its column number.
- [x] AC-11 — A `SCREEN` indicator is rendered above row 1.
- [x] AC-12 — Row 1, columns 10 to 15 are accessible seats — 6 of them.
- [x] AC-13 — Row 15 renders 12 couches, each spanning two adjacent columns: 1–2, 3–4, … 23–24.
- [x] AC-14 — A couch is rendered as one wide element, visually distinct from a single seat.
- [x] AC-15 — The total number of selectable elements in the auditorium is 308 (200 seats in rows 1–10, 96 in rows 11–14, 12 couches in row 15).
- [x] AC-56 — The seat selection shows the title `Choose your seats` and the subtitle `Show Date: <Weekday> <D> <Mon> <HH:mm>` of the screening.
- [x] AC-57 — Above the seat map, horizontally centred over it, the text `You can reserve up to 10 seats per reservation` is shown.
