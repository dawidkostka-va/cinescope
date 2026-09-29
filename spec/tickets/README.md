# Tickets

Work through the tickets in order. A ticket can start once every ticket in its
**Blocked by** line is done. The specification is [`../README.md`](../README.md); each
ticket names the sections it implements and the acceptance criteria it must satisfy.

| # | Ticket | Blocked by | Criteria |
|---|---|---|---|
| 01 | [Movie list and day picker](01-movie-list.md) | — | 11 |
| 02 | [Auditorium map](02-auditorium-map.md) | 01 | 13 |
| 03 | [Seat selection, legend and selected-seats panel](03-seat-selection.md) | 02 | 14 |
| 04 | [Booking and summary](04-booking-summary.md) | 03 | 16 |
| 05 | [Checkout and payment](05-checkout.md) | 04 | 13 |
| 06 | [Confirmation and booking lifecycle](06-confirmation.md) | 05 | 2 |
| 07 | [Final pass](07-final-pass.md) | 01–06 | all |

A ticket is done when every box in it is ticked and `pnpm nx build <app>` succeeds.
