# 06: Confirmation and booking lifecycle

**What to build:** After a successful payment the customer sees the confirmation with their email address; `Continue` clears the booking and returns to `/`. The whole booking lifecycle from section 3.1 holds: it survives reloads, and every route guards against a missing or mismatched booking.

**Specification:** sections 3.1, 8, 9.5.

**Blocked by:** 05 — Checkout and payment.

**Status:** ready

- [x] AC-48 — `/confirmation` shows `Payment successful` and `Your tickets will be sent shortly to <email>`; `Continue` navigates to `/` and clears the booking; the booking survives a reload via `sessionStorage`; entering the summary, checkout or confirmation without a matching booking redirects to `/`.
- [x] AC-69 — Every confirmation identifier in section 9.5 is present with the exact names and values given there.
- [x] Reloading `/confirmation` after paying still shows the confirmation.
- [x] After `Continue`, the seat map of the same screening shows no selected seats and the checkout form of a new booking is empty.
