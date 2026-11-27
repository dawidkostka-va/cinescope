import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Observable, catchError, map, switchMap, tap } from 'rxjs';
import { API_URL } from '../api';
import { BookingService } from '../booking';
import { Movie, Screening } from '../models';
import { Ticket, formatPrice, ticketsOf, totalOf } from '../tickets';

interface SummaryDetails {
  screening: Screening;
  movie: Movie;
}

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly booking = inject(BookingService);

  protected readonly details = signal<SummaryDetails | null>(null);
  /** Seat identifiers of the booking; kept in step with sessionStorage on every removal. */
  private readonly seatIds = signal<readonly string[]>([]);

  protected readonly tickets = computed(() => ticketsOf(this.seatIds()));
  protected readonly formatPrice = formatPrice;
  protected readonly totalLabel = computed(() => `Total: ${formatPrice(totalOf(this.tickets()))}`);

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id') ?? ''),
        tap(() => this.details.set(null)),
        switchMap((id) =>
          this.loadDetails(id).pipe(
            catchError(() => {
              void this.router.navigateByUrl('/');
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((details) => {
        this.details.set(details);
        this.seatIds.set(this.booking.current()?.seats ?? []);
      });
  }

  /** Takes a seat or couch out of the booking; removing the last one returns to the seat map. */
  protected remove(ticket: Ticket): void {
    const current = this.booking.current();
    if (!current) {
      return;
    }
    const seats = current.seats.filter((id) => !ticket.seatIds.includes(id));
    this.booking.save({ ...current, seats });
    this.seatIds.set(seats);
    if (seats.length === 0) {
      this.openScreen('seats');
    }
  }

  protected back(): void {
    this.openScreen('seats');
  }

  protected confirm(): void {
    this.openScreen('checkout');
  }

  private openScreen(screen: 'seats' | 'checkout'): void {
    const screeningId = this.booking.current()?.screeningId ?? this.details()?.screening.id;
    if (screeningId !== undefined) {
      void this.router.navigate(['/screenings', screeningId, screen]);
    }
  }

  /** Loads the screening and its movie; both must load for the summary to show. */
  private loadDetails(id: string): Observable<SummaryDetails> {
    return this.http.get<Screening>(`${API_URL}/screenings/${id}`).pipe(
      switchMap((screening) =>
        this.http
          .get<Movie>(`${API_URL}/movies/${screening.movieId}`)
          .pipe(map((movie) => ({ screening, movie }))),
      ),
    );
  }
}
