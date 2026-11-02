import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { Movie, Screening } from '../core/models';
import { TicketItem, describeTicket, formatPrice } from '../core/seats';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class SummaryComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  protected readonly booking = inject(BookingService);
  private readonly screeningId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly screening = signal<Screening | null>(null);
  protected readonly movie = signal<Movie | null>(null);
  protected readonly formatPrice = formatPrice;

  constructor() {
    this.api
      .screeningWithMovie(this.screeningId)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: ({ screening, movie }) => {
          this.screening.set(screening);
          this.movie.set(movie);
        },
        error: () => this.router.navigateByUrl('/', { replaceUrl: true }),
      });
  }

  protected describe(item: TicketItem): string {
    return item.couch ? `Couch ${describeTicket(item)}` : describeTicket(item);
  }

  protected remove(item: TicketItem): void {
    this.booking.removeSeats(item.ids);
    if (this.booking.seats().length === 0) this.goTo('seats');
  }

  protected goTo(page: 'seats' | 'checkout'): void {
    this.router.navigate(['/screenings', this.screeningId, page]);
  }
}
