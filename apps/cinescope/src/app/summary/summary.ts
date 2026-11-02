import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { ApiService } from '../api.service';
import { BookingService } from '../booking.service';
import { Movie, Screening } from '../models';
import { Ticket, formatPrice } from '../seating';

@Component({
  selector: 'app-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  template: `
    @if (screening(); as s) {
      <div class="page">
        <h1 data-testid="summary-title">Your tickets</h1>
        <ul class="list" data-testid="summary-list">
          @for (t of booking.tickets(); track t.ids[0]) {
            <li class="item" data-testid="summary-item">
              <span class="title" data-testid="summary-item-title">{{ movie()?.title }}</span>
              <span data-testid="summary-item-datetime">{{ s.date }} {{ s.time }}</span>
              <span class="cell">Row <span data-testid="summary-item-row">{{ t.row }}</span></span>
              <span class="cell">Seat <span data-testid="summary-item-seat">{{ seatText(t) }}</span></span>
              <span class="price" data-testid="summary-item-price">{{ price(t) }}</span>
              <button mat-stroked-button type="button" data-testid="summary-item-remove-button" (click)="remove(t)">
                Remove
              </button>
            </li>
          }
        </ul>
        <p class="total" data-testid="summary-total">Total: {{ total() }} PLN</p>
        <div class="actions">
          <button mat-stroked-button type="button" data-testid="back-button" (click)="back()">Back</button>
          <button mat-flat-button type="button" data-testid="confirm-button" (click)="confirm()">Confirm</button>
        </div>
      </div>
    } @else {
      <p class="loading">Loading…</p>
    }
  `,
  styles: `
    .page {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px;
    }
    .loading {
      padding: 24px;
    }
    .list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .item {
      display: grid;
      grid-template-columns: 1fr 160px 80px 100px 100px auto;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid #ddd;
    }
    .title {
      font-weight: 500;
    }
    .total {
      font-size: 18px;
      font-weight: 500;
    }
    .actions {
      display: flex;
      gap: 12px;
    }
  `,
})
export class Summary {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly screeningId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  readonly booking = inject(BookingService);

  readonly screening = signal<Screening | null>(null);
  readonly movie = signal<Movie | null>(null);

  constructor() {
    this.api
      .getScreening(this.screeningId)
      .pipe(
        switchMap((screening) => this.api.getMovie(screening.movieId).pipe(map((movie) => ({ screening, movie })))),
      )
      .subscribe({
        next: ({ screening, movie }) => {
          this.movie.set(movie);
          this.screening.set(screening);
        },
        error: () => this.router.navigateByUrl('/'),
      });
  }

  seatText(t: Ticket): string {
    return t.couch ? `Couch ${t.columnStart}-${t.columnEnd}` : `${t.columnStart}`;
  }

  price(t: Ticket): string {
    return formatPrice(t.price);
  }

  total(): string {
    return this.booking.total().toFixed(2);
  }

  remove(t: Ticket): void {
    const seats = (this.booking.booking()?.seats ?? []).filter((id) => !t.ids.includes(id));
    this.booking.setSeats(seats);
    if (seats.length === 0) this.router.navigate(['/screenings', this.screeningId, 'seats']);
  }

  back(): void {
    this.router.navigate(['/screenings', this.screeningId, 'seats']);
  }

  confirm(): void {
    this.router.navigate(['/screenings', this.screeningId, 'checkout']);
  }
}
