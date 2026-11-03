# 05: Checkout and payment

**What to build:** The customer fills in their details on the checkout form (`Your details`), sees validation messages as they go, can go `Back` to the summary and return — or reload — without losing what they typed, and pays with the `Pay <total> PLN` button. Paying sends the reservation to the backend; success opens `/confirmation`, failure keeps the form and shows a toast.

**Specification:** sections 2.1, 2.2 (`POST /reservations`), 3.1, 7, 9.4, 9.7.

**Blocked by:** 04 — Booking and summary.

**Status:** done

- [x] AC-41 — The form renders first name, last name, email, confirm email, phone number and a terms checkbox.
- [x] AC-42 — First name and last name are required and must be at least 2 characters.
- [x] AC-43 — Email is required and must be a valid address; confirm email must match it.
- [x] AC-44 — Phone number is optional; when filled it must be exactly 9 digits.
- [x] AC-45 — The terms checkbox is required.
- [x] AC-46 — The pay button is enabled whenever no payment request is in flight; clicking it on an invalid form marks all fields as touched, shows the messages and shows the toast `The form contains errors`, without navigating.
- [x] AC-47 — The pay button on a valid form sends `POST /reservations`, is disabled while the request is in flight, navigates to `/confirmation` on success, and on failure stays on the form and shows the toast `Payment failed. Please try again.`
- [x] AC-61 — The checkout shows the title `Your details`.
- [x] AC-62 — The pay button reads `Pay <total> PLN`, the total of the booking.
- [x] AC-63 — `Back` on the checkout returns to the summary with the booking intact.
- [x] AC-64 — The checkout values survive going back to the summary and forward again, and a page reload; a new booking starts with an empty form.
- [x] AC-65 — The labels of the five required fields end with `*`; the phone label does not.
- [x] AC-68 — Every checkout identifier in section 9.4 is present with the exact names and values given there.
