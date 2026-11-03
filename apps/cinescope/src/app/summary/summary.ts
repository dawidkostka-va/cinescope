import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, map } from 'rxjs';
import { ApiService } from '../api.service';
import { BookingService } from '../booking.service';
import { Movie, Screening } from '../models';
import { Item, formatPrice, itemLabel } from '../seats';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  template: `
    @if (data(); as d) {
      <div class="page">
        <h1 data-testid="summary-title">Your tickets</h1>
        <ul class="list" data-testid="summary-list">
          @for (item of booking.items(); track item.ids[0]) {
            <li class="item" data-testid="summary-item">
              <span class="title" data-testid="summary-item-title">{{ d.movie.title }}</span>
              <span data-testid="summary-item-datetime">{{ d.screening.date }} {{ d.screening.time }}</span>
              <span class="field">Row <b data-testid="summary-item-row">{{ item.row }}</b></span>
              <span class="field">Seat <b data-testid="summary-item-seat">{{ seatText(item) }}</b></span>
              <span class="price" data-testid="summary-item-price">{{ price(item.price) }}</span>
              <button mat-stroked-button type="button" data-testid="summary-item-remove-button" (click)="remove(item, d.screening.id)">
                Remove
              </button>
            </li>
          }
        </ul>
        <p class="total" data-testid="summary-total">Total: {{ totalText() }}</p>
        <div class="actions">
          <button mat-stroked-button type="button" data-testid="back-button" (click)="back(d.screening.id)">Back</button>
          <button mat-flat-button type="button" data-testid="confirm-button" (click)="confirm(d.screening.id)">
            Confirm
          </button>
        </div>
      </div>
    }
  `,
  styles: `
    .page {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px;
    }
    .list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .item {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 12px 0;
      border-bottom: 1px solid #ddd;
    }
    .title {
      flex: 1;
      font-weight: 500;
    }
    .price {
      min-width: 90px;
      text-align: right;
    }
    .total {
      font-size: 20px;
      font-weight: 500;
    }
    .actions {
      display: flex;
      gap: 12px;
    }
  `,
})
export class Summary {
  protected readonly booking = inject(BookingService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly data = signal<{ screening: Screening; movie: Movie } | null>(null);
  protected readonly price = formatPrice;

  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
    this.api
      .screening(id)
      .pipe(
        switchMap((screening) => this.api.movie(screening.movieId).pipe(map((movie) => ({ screening, movie })))),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe({
        next: (data) => this.data.set(data),
        error: () => this.router.navigateByUrl('/'),
      });
  }

  protected seatText(item: Item): string {
    return item.couch ? `Couch ${itemLabel(item)}` : itemLabel(item);
  }

  protected totalText(): string {
    return formatPrice(this.booking.total());
  }

  protected remove(item: Item, screeningId: number): void {
    const seats = (this.booking.state()?.seats ?? []).filter((id) => !item.ids.includes(id));
    this.booking.setSeats(seats);
    if (seats.length === 0) this.router.navigate(["/screenings", screeningId, "seats"]);
  }

  protected back(id: number): void {
    this.router.navigate(['/screenings', id, 'seats']);
  }

  protected confirm(id: number): void {
    this.router.navigate(['/screenings', id, 'checkout']);
  }
}
