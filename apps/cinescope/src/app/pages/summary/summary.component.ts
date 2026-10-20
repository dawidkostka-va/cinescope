import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { BookingService } from '../../core/booking.service';
import { Movie, Screening } from '../../core/models';
import { formatPrice } from '../../core/date.util';
import { TicketItem, buildTickets } from '../../core/seat-map.util';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
})
export class SummaryComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly bookingService = inject(BookingService);

  readonly screeningId = toSignal(this.route.paramMap.pipe(map((params) => Number(params.get('id')))), {
    initialValue: NaN,
  });

  readonly screening = signal<Screening | null>(null);
  readonly movie = signal<Movie | null>(null);
  readonly loaded = signal(false);

  readonly tickets = computed<TicketItem[]>(() => buildTickets(this.bookingService.booking()?.seats ?? []));
  readonly total = computed(() => this.tickets().reduce((sum, item) => sum + item.price, 0));

  readonly formatPrice = formatPrice;

  constructor() {
    effect(() => {
      const id = this.screeningId();
      if (!id || Number.isNaN(id)) return;
      this.api
        .getScreening(id)
        .pipe(switchMap((screening) => this.api.getMovie(screening.movieId).pipe(map((movie) => ({ screening, movie })))))
        .subscribe({
          next: ({ screening, movie }) => {
            this.screening.set(screening);
            this.movie.set(movie);
            this.loaded.set(true);
          },
          error: () => this.router.navigateByUrl('/'),
        });
    });
  }

  dateTime(): string {
    const screening = this.screening();
    return screening ? `${screening.date} ${screening.time}` : '';
  }

  remove(item: TicketItem): void {
    this.bookingService.removeIds(item.ids);
    const remaining = this.bookingService.booking()?.seats.length ?? 0;
    if (remaining === 0) {
      this.router.navigate(['/screenings', this.screeningId(), 'seats']);
    }
  }

  back(): void {
    this.router.navigate(['/screenings', this.screeningId(), 'seats']);
  }

  confirm(): void {
    this.router.navigate(['/screenings', this.screeningId(), 'checkout']);
  }
}
