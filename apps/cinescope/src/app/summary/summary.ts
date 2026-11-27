import { Component, computed, effect, inject, input, resource } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookedItem, BookingStore, formatPrice, itemKey, priceOf, totalPrice } from '../booking';
import { CinemaApi } from '../cinema-api';
import { Movie, Screening } from '../models';

interface SummaryData {
  movie: Movie;
  screening: Screening;
}

interface SummaryLine {
  key: string;
  item: BookedItem;
  seat: string;
  price: string;
}

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly api = inject(CinemaApi);
  private readonly bookings = inject(BookingStore);
  private readonly router = inject(Router);

  /** Bound from the `id` route parameter. */
  readonly id = input.required<string>();

  protected readonly data = resource({
    params: () => this.id(),
    loader: async ({ params: id }): Promise<SummaryData> => {
      const screening = await this.api.getScreening(Number(id));
      const movie = await this.api.getMovie(screening.movieId);
      return { movie, screening };
    },
  });

  /** The loaded screening and movie; `undefined` while loading or after a failed load. */
  protected readonly loaded = computed(() => (this.data.hasValue() ? this.data.value() : undefined));

  protected readonly lines = computed<SummaryLine[]>(() =>
    (this.bookings.booking()?.items ?? []).map((item) => ({
      key: itemKey(item),
      item,
      seat: item.couch ? `Couch ${item.column}-${item.column + 1}` : `${item.column}`,
      price: formatPrice(priceOf(item)),
    })),
  );

  protected readonly total = computed(
    () => `Total: ${formatPrice(totalPrice(this.bookings.booking()?.items ?? []))}`,
  );

  constructor() {
    effect(() => {
      if (this.data.error()) {
        this.router.navigate(['/']);
      }
    });
  }

  /** Takes one seat or couch out of the booking; opens the seat map when none is left. */
  protected remove(key: string): void {
    const remaining = (this.bookings.booking()?.items ?? []).filter((item) => itemKey(item) !== key);
    this.bookings.setItems(remaining);
    if (remaining.length === 0) {
      this.toSeats();
    }
  }

  protected back(): void {
    this.toSeats();
  }

  protected confirm(): void {
    this.router.navigate(['/screenings', this.id(), 'checkout']);
  }

  private toSeats(): void {
    this.router.navigate(['/screenings', this.id(), 'seats']);
  }
}
