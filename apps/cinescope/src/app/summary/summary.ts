import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, catchError, map, switchMap } from 'rxjs';
import { BookingStore, TicketItem, ticketsFor } from '../booking';
import { CinemaApi } from '../cinema-api.service';
import { formatPrice } from '../pricing';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly bookings = inject(BookingStore);

  readonly formatPrice = formatPrice;

  /** Seat identifiers of the booking; the route guard ensures a booking exists for this screening. */
  private readonly seats = signal<string[]>(this.bookings.read()?.seats ?? []);

  /** Null while loading; a failed load redirects to `/`. */
  readonly loaded = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('id') ?? ''),
      switchMap((id) =>
        this.api.screeningWithMovie(id).pipe(
          catchError(() => {
            void this.router.navigate(['/']);
            return EMPTY;
          }),
        ),
      ),
    ),
    { initialValue: null },
  );

  readonly items = computed(() => ticketsFor(this.seats()));

  readonly total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0));

  /** Removes a seat or couch from the booking; removing the last one returns to the seat map. */
  remove(item: TicketItem): void {
    const booking = this.bookings.read();
    if (!booking) {
      return;
    }
    const seats = booking.seats.filter((id) => !item.seatIds.includes(id));
    this.bookings.write({ ...booking, seats });
    this.seats.set(seats);
    if (seats.length === 0) {
      void this.router.navigate(['/screenings', booking.screeningId, 'seats']);
    }
  }

  back(): void {
    this.navigateTo('seats');
  }

  confirm(): void {
    this.navigateTo('checkout');
  }

  private navigateTo(step: 'seats' | 'checkout'): void {
    const screening = this.loaded()?.screening;
    if (screening) {
      void this.router.navigate(['/screenings', screening.id, step]);
    }
  }
}
