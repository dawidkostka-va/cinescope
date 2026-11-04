import { Component, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../core/api';
import { BookingStore } from '../core/booking';
import { Movie, Screening } from '../core/models';
import { TicketItem, formatPrice } from '../core/seats';

@Component({
  selector: 'app-summary',
  imports: [MatButton],
  template: `
    @if (loaded()) {
      <main class="page">
        <h1 data-testid="summary-title">Your tickets</h1>
        <ul class="list" data-testid="summary-list">
          @for (item of store.items(); track item.ids[0]) {
            <li class="item" data-testid="summary-item">
              <span class="field title" data-testid="summary-item-title">{{ movie()?.title }}</span>
              <span class="field" data-testid="summary-item-datetime">{{ screening()?.date }} {{ screening()?.time }}</span>
              <span class="field">Row <span data-testid="summary-item-row">{{ item.row }}</span></span>
              <span class="field">Seat <span data-testid="summary-item-seat">{{ seatText(item) }}</span></span>
              <span class="field price" data-testid="summary-item-price">{{ price(item.price) }}</span>
              <button matButton="outlined" data-testid="summary-item-remove-button" (click)="remove(item)">Remove</button>
            </li>
          }
        </ul>
        <p class="total" data-testid="summary-total">Total: {{ price(store.total()) }}</p>
        <div class="actions">
          <button matButton="outlined" data-testid="back-button" (click)="back()">Back</button>
          <button matButton="filled" data-testid="confirm-button" (click)="confirm()">Confirm</button>
        </div>
      </main>
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
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .item {
      display: flex;
      align-items: center;
      gap: 24px;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 8px 16px;
    }
    .title {
      flex: 1;
      font-weight: 500;
    }
    .price {
      min-width: 80px;
      text-align: right;
    }
    .total {
      font-weight: 500;
      font-size: 18px;
    }
    .actions {
      display: flex;
      gap: 16px;
    }
  `,
})
export class Summary {
  private readonly router = inject(Router);
  protected readonly store = inject(BookingStore);
  private readonly screeningId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly screening = signal<Screening | null>(null);
  protected readonly movie = signal<Movie | null>(null);
  protected readonly loaded = signal(false);

  constructor() {
    inject(Api)
      .screeningWithMovie(this.screeningId)
      .subscribe({
        next: ({ screening, movie }) => {
          this.screening.set(screening);
          this.movie.set(movie);
          this.loaded.set(true);
        },
        error: () => this.router.navigateByUrl('/'),
      });
  }

  protected price = formatPrice;

  protected seatText(item: TicketItem): string {
    return item.columnEnd === null ? `${item.column}` : `Couch ${item.column}-${item.columnEnd}`;
  }

  protected remove(item: TicketItem): void {
    this.store.setSeats(this.store.seats().filter((id) => !item.ids.includes(id)));
    if (this.store.seats().length === 0) {
      this.router.navigate(['/screenings', this.screeningId, 'seats']);
    }
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.screeningId, 'seats']);
  }

  protected confirm(): void {
    this.router.navigate(['/screenings', this.screeningId, 'checkout']);
  }
}
