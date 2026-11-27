import { Component, computed, effect, inject, linkedSignal, resource } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../api.service';
import { BookingService, formatPrice, ticketsFor } from '../booking';
import { Movie, Screening } from '../models';

/** A summary line with everything its template shows (section 6). */
interface SummaryItem {
  key: string;
  /** Seat identifiers of the line, used to remove it from the booking. */
  ids: string[];
  title: string;
  datetime: string;
  row: number;
  seat: string;
  price: number;
  priceLabel: string;
}

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly api = inject(ApiService);
  private readonly bookings = inject(BookingService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly params = toSignal(this.route.paramMap, { requireSync: true });

  /** The screening id from the URL; undefined keeps the resource idle. */
  private readonly screeningId = computed(() => this.params().get('id') ?? undefined);

  readonly data = resource({
    params: () => this.screeningId(),
    loader: async ({ params: id }): Promise<{ screening: Screening; movie: Movie }> => {
      const screening = await firstValueFrom(this.api.getScreening(id));
      const movie = await firstValueFrom(this.api.getMovie(screening.movieId));
      return { screening, movie };
    },
  });

  readonly screening = computed(() => (this.data.hasValue() ? this.data.value().screening : null));

  /** Seat identifiers of the booking in progress; a removed ticket is taken out of it. */
  private readonly seats = linkedSignal<string | undefined, string[]>({
    source: this.screeningId,
    computation: (id) => this.bookings.seatsFor(id),
  });

  readonly items = computed<SummaryItem[]>(() => {
    if (!this.data.hasValue()) {
      return [];
    }
    const { screening, movie } = this.data.value();
    const datetime = `${screening.date} ${screening.time}`;
    return ticketsFor(this.seats()).map((ticket) => ({
      key: ticket.ids.join(' '),
      ids: ticket.ids,
      title: movie.title,
      datetime,
      row: ticket.row,
      seat: ticket.seat,
      price: ticket.price,
      priceLabel: formatPrice(ticket.price),
    }));
  });

  readonly totalLabel = computed(() =>
    formatPrice(this.items().reduce((total, item) => total + item.price, 0)),
  );

  constructor() {
    effect(() => {
      if (this.data.status() === 'error') {
        void this.router.navigate(['/']);
      }
    });
  }

  /** Removes a ticket from the booking. Removing the last one opens the seat map. */
  remove(item: SummaryItem): void {
    const screening = this.screening();
    if (!screening) {
      return;
    }
    const seats = this.seats().filter((id) => !item.ids.includes(id));
    this.seats.set(seats);
    this.bookings.update({ seats });
    if (seats.length === 0) {
      this.openScreen('seats');
    }
  }

  back(): void {
    this.openScreen('seats');
  }

  confirm(): void {
    this.openScreen('checkout');
  }

  private openScreen(page: 'seats' | 'checkout'): void {
    const screening = this.screening();
    if (screening) {
      void this.router.navigate(['/screenings', screening.id, page]);
    }
  }
}
