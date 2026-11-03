import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { Api, Movie, Screening, parseId } from '../core/api';
import { BookingStore } from '../core/booking';
import { BookingItem, formatPrice, itemLabel } from '../core/seats';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly booking = inject(BookingStore);
  private readonly screeningId = parseId(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly format = formatPrice;
  protected readonly screening = signal<Screening | null>(null);
  protected readonly movie = signal<Movie | null>(null);

  constructor() {
    const id = this.screeningId;
    if (id === null) {
      void this.router.navigateByUrl('/');
      return;
    }
    this.api
      .screening(id)
      .pipe(
        switchMap((screening) => this.api.movie(screening.movieId).pipe(map((movie) => ({ screening, movie })))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ screening, movie }) => {
          this.screening.set(screening);
          this.movie.set(movie);
        },
        error: () => void this.router.navigateByUrl('/'),
      });
  }

  protected seatText(item: BookingItem): string {
    return item.couch ? `Couch ${itemLabel(item)}` : itemLabel(item);
  }

  protected remove(item: BookingItem): void {
    this.booking.setSeats(this.booking.seats().filter((id) => !item.ids.includes(id)));
    if (this.booking.items().length === 0) {
      void this.router.navigate(['/screenings', this.screeningId, 'seats']);
    }
  }

  protected back(): void {
    void this.router.navigate(['/screenings', this.screeningId, 'seats']);
  }

  protected confirm(): void {
    void this.router.navigate(['/screenings', this.screeningId, 'checkout']);
  }
}
