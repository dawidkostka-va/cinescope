import { Component, computed, effect, inject, resource, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { BookedSeat, BookingService, isSameSeat, sortSeats } from '../booking';
import { CinescopeApi } from '../cinescope-api';
import { formatPrice, priceOf } from '../pricing';

/** One line of the summary: a seat or couch of the booking, with its description and price. */
interface SummaryItem {
  key: string;
  seat: BookedSeat;
  description: string;
  price: string;
}

@Component({
  selector: 'app-summary',
  imports: [MatButton],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly api = inject(CinescopeApi);
  private readonly bookings = inject(BookingService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly params = toSignal(this.route.paramMap, { requireSync: true });

  /** Loads the screening and its movie once when the screen opens. */
  protected readonly details = resource({
    params: () => Number(this.params().get('id')),
    loader: ({ params: id }) => this.api.loadScreening(id),
  });

  /** The loaded screening, or null while loading or after a failed load (`value()` would throw). */
  protected readonly loaded = computed(() => (this.details.hasValue() ? this.details.value() : null));

  /** Seats and couches of the booking, ordered by row and then by column. */
  private readonly seats = signal<BookedSeat[]>(this.bookings.current()?.seats ?? []);

  protected readonly items = computed<SummaryItem[]>(() =>
    sortSeats(this.seats()).map((seat) => ({
      key: `${seat.row}:${seat.column}`,
      seat,
      description: seat.kind === 'couch' ? `Couch ${seat.column}-${seat.columnEnd}` : `${seat.column}`,
      price: formatPrice(priceOf(seat)),
    })),
  );

  protected readonly total = computed(() =>
    formatPrice(this.seats().reduce((sum, seat) => sum + priceOf(seat), 0)),
  );

  constructor() {
    // A screening that cannot be loaded (404 or any other failure) sends the customer back to the movie list.
    effect(() => {
      if (this.details.status() === 'error') {
        void this.router.navigate(['/']);
      }
    });

  }

  /** Takes a seat or couch out of the booking. Removing the last one returns to the seat map. */
  protected remove(seat: BookedSeat): void {
    const data = this.loaded();
    if (!data) {
      return;
    }
    const seats = this.seats().filter((selected) => !isSameSeat(selected, seat));
    this.seats.set(seats);
    this.bookings.saveSeats(data.screening.id, seats);
    if (seats.length === 0) {
      void this.router.navigate(['/screenings', data.screening.id, 'seats']);
    }
  }

  protected back(): void {
    const data = this.loaded();
    if (data) {
      void this.router.navigate(['/screenings', data.screening.id, 'seats']);
    }
  }

  protected confirm(): void {
    const data = this.loaded();
    if (data) {
      void this.router.navigate(['/screenings', data.screening.id, 'checkout']);
    }
  }
}
