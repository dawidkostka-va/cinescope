# 04: Booking and summary

**What to build:** The selection becomes a booking kept in `sessionStorage`. `Continue` takes the customer to the summary (`Your tickets`), which lists each ticket with its price, a `Remove` button and the total; `Back` returns to the seat map with the selection intact and `Cancel` on the seat map clears the booking. The summary and checkout routes redirect to `/` without a matching booking.

**Specification:** sections 3.1, 5.4, 5.6, 6, 9.3, 9.7.

**Blocked by:** 03 — Seat selection, legend and selected-seats panel.

**Status:** ready-for-agent

- [ ] AC-28 — Seats in rows 1–5 cost `25.00 PLN`.
- [ ] AC-29 — Seats in rows 6–10 cost `32.00 PLN`.
- [ ] AC-30 — Seats in rows 11–14 cost `39.00 PLN`.
- [ ] AC-31 — A couch costs `89.00 PLN` per couch, not per seat.
- [ ] AC-32 — Accessible seats cost `25.00 PLN`, like the rest of row 1.
- [ ] AC-33 — `Cancel` navigates to `/` and clears the selection.
- [ ] AC-34 — `Continue` navigates to `/screenings/:id/summary`.
- [ ] AC-35 — `Continue` does nothing when no seat is selected.
- [ ] AC-36 — Each selected item is listed with movie title, screening date, time, row number, seat description and price.
- [ ] AC-37 — A couch is described as `Couch <a>-<b>`; a single seat is described by its column number.
- [ ] AC-38 — The total line reads `Total: <sum> PLN` and equals the sum of the listed prices.
- [ ] AC-39 — `Back` returns to the seat map with the selection intact.
- [ ] AC-40 — `Confirm` navigates to `/screenings/:id/checkout`.
- [ ] AC-59 — The summary shows the title `Your tickets`.
- [ ] AC-60 — Each summary item has a `Remove` button that removes it from the booking and updates the total; removing the last item returns to the seat map.
- [ ] AC-67 — Every summary identifier in section 9.3 is present with the exact names and values given there.
- [ ] The booking survives a reload of the seat map and of the summary.
