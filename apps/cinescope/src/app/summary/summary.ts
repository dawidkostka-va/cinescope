import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { Api } from '../core/api';
import { Booking } from '../core/booking';
import { Movie, Screening } from '../core/models';
import { Item, describe, formatPrice } from '../core/seating';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly booking = inject(Booking);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly data = signal<{ screening: Screening; movie: Movie } | null>(null);
  protected readonly items = this.booking.items;
  protected readonly total = computed(() => formatPrice(this.booking.total()));

  constructor() {
    this.api
      .screening(this.id)
      .pipe(switchMap((screening) => this.api.movie(screening.movieId).pipe(map((movie) => ({ screening, movie })))))
      .subscribe({
        next: ({ screening, movie }) => this.data.set({ screening, movie }),
        error: () => this.router.navigateByUrl('/'),
      });
  }

  protected seatText(item: Item): string {
    return item.kind === 'couch' ? `Couch ${describe(item)}` : describe(item);
  }

  protected price(item: Item): string {
    return formatPrice(item.price);
  }

  protected remove(item: Item): void {
    this.booking.setSeats(this.booking.seats().filter((id) => !item.ids.includes(id)));
    if (this.booking.items().length === 0) {
      this.router.navigate(['/screenings', this.id, 'seats']);
    }
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.id, 'seats']);
  }

  protected confirm(): void {
    this.router.navigate(['/screenings', this.id, 'checkout']);
  }
}
