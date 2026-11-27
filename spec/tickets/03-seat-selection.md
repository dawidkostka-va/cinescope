# 03: Seat selection, legend and selected-seats panel

**What to build:** On the seat map the customer selects and deselects seats and couches, up to 10 seats per booking with a couch counting as 2. Unavailable seats cannot be selected. Exceeding the limit shows a toast. Every state has its colour, the legend explains them, and the selected-seats panel lists the current selection by row.

**Specification:** sections 3.2, 5.2, 5.3, 5.5, 9.2, 9.6, 9.7.

**Blocked by:** 02 — Auditorium map.

**Status:** ready

- [x] AC-16 — Seats listed in `occupiedSeats` for the screening are rendered unavailable and cannot be selected.
- [x] AC-17 — A couch is unavailable when either of its two seat identifiers is in `occupiedSeats`.
- [x] AC-18 — Clicking an available seat selects it; clicking it again deselects it.
- [x] AC-19 — Clicking a couch selects both of its seats as one unit; it cannot be half-selected.
- [x] AC-20 — Selection is capped at 10 seats; a couch counts as 2.
- [x] AC-21 — A click that would exceed 10 seats is ignored and shows the toast `Maximum 10 seats per booking`.
- [x] AC-22 — At the cap, already selected seats and couches can still be deselected.
- [x] AC-23 — The legend lists exactly `Available`, `Selected`, `Unavailable`, `Accessible`.
- [x] AC-24 — Available seats use `#2E7D32`.
- [x] AC-25 — Selected seats use `#F9A825`.
- [x] AC-26 — Unavailable seats use `#C62828`.
- [x] AC-27 — Accessible seats use `#1565C0`.
- [x] AC-58 — Between the seat map and the `Cancel` / `Continue` buttons, the selected-seats panel shows `Selected seats: <n>` and one `Row <r>: <seats>` line per row, updated on every selection change.
- [x] AC-66 — Every seat-selection identifier in section 9.2, and the toast identifier in section 9.6, is present with the exact names and values given there.
