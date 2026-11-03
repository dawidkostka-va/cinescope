import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { ApiService } from '../api.service';
import { BookingService, Ticket, formatPrice } from '../booking.service';
import { Movie, Screening } from '../models';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  template: `
    @if (data(); as d) {
      <div class="page">
        <h1 data-testid="summary-title">Your tickets</h1>
        <div class="list" data-testid="summary-list">
          @for (t of booking.tickets(); track t.ids[0]) {
            <div class="item" data-testid="summary-item">
              <strong data-testid="summary-item-title">{{ d.movie.title }}</strong>
              <span data-testid="summary-item-datetime">{{ d.screening.date }} {{ d.screening.time }}</span>
              <span>Row <span data-testid="summary-item-row">{{ t.row }}</span></span>
              <span>Seat <span data-testid="summary-item-seat">{{ seatText(t) }}</span></span>
              <span class="price" data-testid="summary-item-price">{{ price(t.price) }} PLN</span>
              <button mat-stroked-button data-testid="summary-item-remove-button" (click)="remove(t)">Remove</button>
            </div>
          }
        </div>
        <p class="total" data-testid="summary-total">Total: {{ price(booking.total()) }} PLN</p>
        <div class="actions">
          <button mat-stroked-button data-testid="back-button" (click)="back()">Back</button>
          <button mat-flat-button data-testid="confirm-button" (click)="confirm()">Confirm</button>
        </div>
      </div>
    }
  `,
  styles: `
    .page {
      max-width: 800px;
    }
    h1 {
      text-align: center;
    }
    .list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .item {
      display: grid;
      grid-template-columns: 1.6fr 1.2fr 0.6fr 1fr 0.9fr auto;
      align-items: center;
      gap: 12px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 10px 16px;
    }
    .price {
      text-align: right;
    }
    .total {
      text-align: right;
      font-size: 20px;
      font-weight: 500;
      margin: 16px 0 0;
    }
  `,
})
export class SummaryPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  protected readonly booking = inject(BookingService);

  protected readonly data = signal<{ screening: Screening; movie: Movie } | null>(null);
  protected readonly price = formatPrice;

  constructor() {
    this.api
      .getScreening(this.id)
      .pipe(
        switchMap((screening) =>
          this.api.getMovie(screening.movieId).pipe(map((movie) => ({ screening, movie }))),
        ),
      )
      .subscribe({
        next: (data) => this.data.set(data),
        error: () => this.router.navigateByUrl('/'),
      });
  }

  protected seatText(t: Ticket): string {
    return t.couch ? `Couch ${t.colStart}-${t.colEnd}` : String(t.colStart);
  }

  protected remove(t: Ticket): void {
    this.booking.remove(t);
    if (this.booking.tickets().length === 0) this.router.navigate(['/screenings', this.id, 'seats']);
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.id, 'seats']);
  }

  protected confirm(): void {
    this.router.navigate(['/screenings', this.id, 'checkout']);
  }
}
