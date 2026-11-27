import { Component, computed, effect, inject, resource } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { BookingStore } from '../booking/booking';
import { describeTicket, formatPrice, identifiersOfTicket, priceOf, Ticket, ticketsFor } from '../booking/tickets';
import { CinemaApi } from '../cinema-api';

@Component({
  selector: 'app-summary',
  imports: [MatButton],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly api = inject(CinemaApi);
  private readonly bookings = inject(BookingStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly params = toSignal(this.route.paramMap, { requireSync: true });
  private readonly screeningId = computed(() => Number(this.params().get('id')));

  protected readonly data = resource({
    params: () => this.screeningId(),
    loader: async ({ params: id }) => {
      const screening = await firstValueFrom(this.api.getScreening(id));
      const movie = await firstValueFrom(this.api.getMovie(screening.movieId));
      return { screening, movie };
    },
  });

  protected readonly lines = computed(() =>
    ticketsFor(this.bookings.booking()?.seats ?? []).map((ticket) => ({
      key: identifiersOfTicket(ticket).join(' '),
      ticket,
      description: describeTicket(ticket),
      price: priceOf(ticket),
    })),
  );

  protected readonly total = computed(() =>
    formatPrice(this.lines().reduce((sum, line) => sum + line.price, 0)),
  );

  protected readonly formatPrice = formatPrice;

  constructor() {
    // A screening or movie that cannot be loaded sends the customer back to the movie list.
    effect(() => {
      if (this.data.error()) {
        void this.router.navigate(['/']);
      }
    });
  }

  protected remove(ticket: Ticket): void {
    const removed = identifiersOfTicket(ticket);
    const remaining = (this.bookings.booking()?.seats ?? []).filter((id) => !removed.includes(id));
    this.bookings.setSeats(remaining);
    if (remaining.length === 0) {
      this.openSeatMap();
    }
  }

  protected onBack(): void {
    this.openSeatMap();
  }

  protected onConfirm(): void {
    void this.router.navigate(['/screenings', this.screeningId(), 'checkout']);
  }

  private openSeatMap(): void {
    void this.router.navigate(['/screenings', this.screeningId(), 'seats']);
  }
}
