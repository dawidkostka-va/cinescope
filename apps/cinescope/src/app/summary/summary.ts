import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { map, switchMap } from 'rxjs/operators';
import { BookingStore } from '../booking/booking.store';
import { formatPrice, ticketsFor } from '../booking/tickets';
import { CinemaApi } from '../cinema.api';
import { Movie, Screening } from '../models';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Summary {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly booking = inject(BookingStore);

  readonly screening = signal<Screening | null>(null);
  readonly movie = signal<Movie | null>(null);
  readonly formatPrice = formatPrice;

  private readonly selectedIds = computed(() => {
    const screening = this.screening();
    return screening ? this.booking.selectedFor(screening.id) : [];
  });

  readonly tickets = computed(() => ticketsFor(this.selectedIds()));
  readonly total = computed(() => this.tickets().reduce((sum, ticket) => sum + ticket.price, 0));

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => this.api.screening(Number(params.get('id')))),
        switchMap((screening) =>
          this.api.movie(screening.movieId).pipe(map((movie) => ({ screening, movie }))),
        ),
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

  remove(ids: string[]): void {
    const screening = this.screening();
    if (!screening) {
      return;
    }
    this.booking.removeTickets(ids);
    if (this.selectedIds().length === 0) {
      void this.router.navigateByUrl(`/screenings/${screening.id}/seats`);
    }
  }

  back(): void {
    const screening = this.screening();
    if (screening) {
      void this.router.navigateByUrl(`/screenings/${screening.id}/seats`);
    }
  }

  confirm(): void {
    const screening = this.screening();
    if (screening) {
      void this.router.navigateByUrl(`/screenings/${screening.id}/checkout`);
    }
  }
}
