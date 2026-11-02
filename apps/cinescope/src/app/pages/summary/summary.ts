import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { Api } from '../../core/api';
import { BookingStore } from '../../core/booking';
import { Movie, Screening } from '../../core/models';
import { TicketItem, formatPrice, itemLabel } from '../../core/seats';

@Component({
  selector: 'app-summary',
  imports: [MatButton],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(BookingStore);

  protected readonly screening = signal<Screening | null>(null);
  protected readonly movie = signal<Movie | null>(null);
  protected readonly loaded = computed(() => this.screening() !== null && this.movie() !== null);

  protected readonly rows = computed(() =>
    this.store.items().map((item) => ({
      item,
      seat: item.couch ? `Couch ${itemLabel(item)}` : itemLabel(item),
      price: formatPrice(item.price),
    })),
  );
  protected readonly total = computed(() => formatPrice(this.store.total()));

  constructor() {
    this.api
      .screening(this.route.snapshot.paramMap.get('id') ?? '')
      .pipe(
        switchMap((screening) => this.api.movie(screening.movieId).pipe(map((movie) => ({ screening, movie })))),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe({
        next: ({ screening, movie }) => {
          this.screening.set(screening);
          this.movie.set(movie);
        },
        error: () => void this.router.navigateByUrl('/', { replaceUrl: true }),
      });
  }

  protected remove(item: TicketItem): void {
    const remaining = this.store.items().filter((i) => i.ids[0] !== item.ids[0]);
    this.store.setItems(remaining);
    if (remaining.length === 0) this.toSeats();
  }

  protected toSeats(): void {
    void this.router.navigate(['/screenings', this.route.snapshot.paramMap.get('id'), 'seats']);
  }

  protected confirm(): void {
    void this.router.navigate(['/screenings', this.route.snapshot.paramMap.get('id'), 'checkout']);
  }
}
