import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { BookingService } from '../../core/booking.service';
import { Movie, Screening } from '../../core/models';
import { formatPrice, toItems, totalOf } from '../../core/seats';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly screeningId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly formatPrice = formatPrice;
  protected readonly data = signal<{ screening: Screening; movie: Movie } | null>(null);

  protected readonly items = computed(() => toItems(this.bookingService.booking()?.seats ?? []));
  protected readonly total = computed(() => totalOf(this.items()).toFixed(2));

  constructor() {
    this.api
      .screening(this.screeningId)
      .pipe(
        switchMap((screening) =>
          forkJoin({ screening: [screening], movie: this.api.movie(screening.movieId) }),
        ),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe({
        next: (data) => this.data.set(data),
        error: () => this.router.navigateByUrl('/'),
      });
  }

  protected remove(ids: string[]) {
    const remaining = (this.bookingService.booking()?.seats ?? []).filter((id) => !ids.includes(id));
    this.bookingService.setSeats(remaining);
    if (remaining.length === 0) this.back();
  }

  protected back() {
    this.router.navigate(['/screenings', this.screeningId, 'seats']);
  }

  protected confirm() {
    this.router.navigate(['/screenings', this.screeningId, 'checkout']);
  }
}
