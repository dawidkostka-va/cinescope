import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { Movie, Screening } from '../core/models';
import { SeatItem, describeSeat, formatPrice } from '../core/seat-utils';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly booking = inject(BookingService);
  private readonly screeningId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly data = signal<{ screening: Screening; movie: Movie } | null>(null);
  protected readonly items = this.booking.items;
  protected readonly total = computed(() => this.booking.total().toFixed(2));

  constructor() {
    this.api
      .screening(this.screeningId)
      .pipe(
        switchMap((screening) => this.api.movie(screening.movieId).pipe(map((movie) => ({ screening, movie })))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (data) => this.data.set(data),
        error: () => this.router.navigateByUrl('/'),
      });
  }

  protected seat(item: SeatItem): string {
    return item.couch ? `Couch ${describeSeat(item)}` : describeSeat(item);
  }

  protected price(item: SeatItem): string {
    return formatPrice(item.price);
  }

  protected remove(item: SeatItem): void {
    this.booking.remove(item.key);
    if (this.booking.items().length === 0) this.goTo('seats');
  }

  protected goTo(page: 'seats' | 'checkout'): void {
    this.router.navigate(['/screenings', this.screeningId, page]);
  }
}
