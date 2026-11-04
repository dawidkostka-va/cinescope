import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { Movie, Screening } from '../core/models';
import { Ticket, formatAmount, formatPrice } from '../core/seats';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  template: `
    @if (details(); as d) {
      <div class="page">
        <h1 data-testid="summary-title">Your tickets</h1>
        <ul class="list" data-testid="summary-list">
          @for (t of tickets(); track t.key) {
            <li class="item" data-testid="summary-item">
              <div class="field"><span class="cap">Movie</span><span data-testid="summary-item-title">{{ d.movie.title }}</span></div>
              <div class="field"><span class="cap">Date</span><span data-testid="summary-item-datetime">{{ d.screening.date }} {{ d.screening.time }}</span></div>
              <div class="field"><span class="cap">Row</span><span data-testid="summary-item-row">{{ t.row }}</span></div>
              <div class="field"><span class="cap">Seat</span><span data-testid="summary-item-seat">{{ seatText(t) }}</span></div>
              <div class="field"><span class="cap">Price</span><span data-testid="summary-item-price">{{ price(t) }}</span></div>
              <button matButton="outlined" data-testid="summary-item-remove-button" (click)="remove(t)">Remove</button>
            </li>
          }
        </ul>
        <p class="total" data-testid="summary-total">Total: {{ total() }} PLN</p>
        <div class="actions">
          <button matButton="outlined" data-testid="back-button" (click)="back()">Back</button>
          <button matButton="filled" data-testid="confirm-button" (click)="confirm()">Confirm</button>
        </div>
      </div>
    }
  `,
  styles: `
    .list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .item {
      display: flex;
      align-items: center;
      gap: 32px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 8px 16px;
    }
    .field {
      display: flex;
      flex-direction: column;
      min-width: 90px;
    }
    .field:first-child {
      min-width: 200px;
    }
    .cap {
      font-size: 0.75rem;
      color: #777;
    }
    .item button {
      margin-left: auto;
    }
    .total {
      font-size: 1.2rem;
      font-weight: 500;
    }
  `,
})
export class Summary {
  private readonly api = inject(ApiService);
  private readonly booking = inject(BookingService);
  private readonly router = inject(Router);
  private readonly screeningId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  readonly details = signal<{ screening: Screening; movie: Movie } | null>(null);
  readonly tickets = this.booking.tickets;
  readonly total = computed(() => formatAmount(this.booking.total()));

  constructor() {
    this.api
      .screening(this.screeningId)
      .pipe(
        switchMap((screening) => forkJoin({ screening: [screening], movie: this.api.movie(screening.movieId) })),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe({
        next: (details) => this.details.set(details as { screening: Screening; movie: Movie }),
        error: () => this.router.navigateByUrl('/'),
      });
  }

  seatText(t: Ticket): string {
    return t.couch ? `Couch ${t.colStart}-${t.colEnd}` : `${t.colStart}`;
  }

  price(t: Ticket): string {
    return formatPrice(t.price);
  }

  remove(ticket: Ticket): void {
    this.booking.setSeats(this.booking.seats().filter((id) => !ticket.ids.includes(id)));
    if (this.booking.seats().length === 0) {
      this.router.navigate(['/screenings', this.screeningId, 'seats']);
    }
  }

  back(): void {
    this.router.navigate(['/screenings', this.screeningId, 'seats']);
  }

  confirm(): void {
    this.router.navigate(['/screenings', this.screeningId, 'checkout']);
  }
}
