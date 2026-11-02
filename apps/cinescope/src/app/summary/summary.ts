import { Component, computed, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { Movie, Screening } from '../core/models';
import { Ticket, formatPrice, seatDescription } from '../core/seats';

@Component({
  selector: 'app-summary',
  imports: [MatButton],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly data = signal<{ screening: Screening; movie: Movie } | null>(null);
  protected readonly tickets = this.bookingService.tickets;
  protected readonly total = computed(() => formatPrice(this.bookingService.total()));
  protected readonly formatPrice = formatPrice;
  protected readonly seatDescription = seatDescription;

  constructor() {
    this.api
      .screening(this.id)
      .pipe(
        switchMap((screening) => this.api.movie(screening.movieId).pipe(map((movie) => ({ screening, movie })))),
      )
      .subscribe({
        next: (data) => this.data.set(data),
        error: () => this.router.navigateByUrl('/'),
      });
  }

  protected remove(ticket: Ticket): void {
    const seats = (this.bookingService.booking()?.seats ?? []).filter((id) => !ticket.ids.includes(id));
    this.bookingService.setSeats(seats);
    if (seats.length === 0) this.router.navigate(['/screenings', this.id, 'seats']);
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.id, 'seats']);
  }

  protected confirm(): void {
    this.router.navigate(['/screenings', this.id, 'checkout']);
  }
}
