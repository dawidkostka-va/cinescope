import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { Movie, Screening } from '../core/models';
import { Ticket, describeTicket, formatPrice } from '../core/seats';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly booking = inject(BookingService);

  protected readonly data = signal<{ screening: Screening; movie: Movie } | null>(null);
  protected readonly totalText = computed(() => `Total: ${formatPrice(this.booking.total())}`);

  protected readonly formatPrice = formatPrice;

  constructor() {
    this.api
      .screening(this.route.snapshot.paramMap.get('id') ?? '')
      .pipe(
        switchMap((screening) => this.api.movie(screening.movieId).pipe(map((movie) => ({ screening, movie })))),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe({
        next: (data) => this.data.set(data),
        error: () => this.router.navigateByUrl('/'),
      });
  }

  protected seatText(ticket: Ticket): string {
    return ticket.kind === 'couch' ? `Couch ${describeTicket(ticket)}` : describeTicket(ticket);
  }

  protected remove(ticket: Ticket): void {
    const current = this.booking.booking();
    if (!current) {
      return;
    }
    const seats = current.seats.filter((id) => !ticket.ids.includes(id));
    this.booking.setSeats(seats);
    if (seats.length === 0) {
      this.router.navigate(['/screenings', current.screeningId, 'seats']);
    }
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.data()?.screening.id, 'seats']);
  }

  protected confirm(): void {
    this.router.navigate(['/screenings', this.data()?.screening.id, 'checkout']);
  }
}
