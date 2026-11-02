import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { Movie, Screening } from '../core/models';
import { Ticket, formatPrice } from '../core/seats';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);

  protected readonly loaded = signal<{ screening: Screening; movie: Movie } | null>(null);
  protected readonly tickets = this.booking.tickets;
  protected readonly total = computed(() => formatPrice(this.booking.total()));
  protected readonly formatPrice = formatPrice;

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(
        map((params) => params.get('id') ?? ''),
        switchMap((id) =>
          this.api
            .getScreening(id)
            .pipe(
              switchMap((screening) =>
                this.api.getMovie(screening.movieId).pipe(map((movie) => ({ screening, movie }))),
              ),
            ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (data) => this.loaded.set(data),
        error: () => this.router.navigateByUrl('/'),
      });
  }

  protected seatText(ticket: Ticket): string {
    return ticket.couch ? `Couch ${ticket.colStart}-${ticket.colEnd}` : `${ticket.colStart}`;
  }

  protected remove(ticket: Ticket): void {
    const remaining = this.booking.seats().filter((id) => !ticket.ids.includes(id));
    this.booking.setSeats(remaining);
    if (remaining.length === 0) {
      this.goTo('seats');
    }
  }

  protected goTo(page: 'seats' | 'checkout'): void {
    const screening = this.loaded()?.screening;
    if (screening) {
      this.router.navigate(['/screenings', screening.id, page]);
    }
  }
}
