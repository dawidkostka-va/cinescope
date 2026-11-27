import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { Api } from '../api';
import { BookingStore } from '../booking';
import { Movie, Screening } from '../models';
import { SeatItem, formatPrice, isCouch, itemLabel, itemPrice } from '../seats/seat-layout';

@Component({
  selector: 'app-summary-page',
  imports: [MatButtonModule],
  template: `
    @if (loaded()) {
      <div class="page">
        <h1 data-testid="summary-title">Your tickets</h1>
        <ul class="list" data-testid="summary-list">
          @for (ticket of tickets(); track ticket.item.row + '-' + ticket.item.column) {
            <li class="ticket" data-testid="summary-item">
              <span class="title" data-testid="summary-item-title">{{ movie()!.title }}</span>
              <span data-testid="summary-item-datetime" [textContent]="screening()!.date + ' ' + screening()!.time"></span>
              <span class="row"
                >Row <span data-testid="summary-item-row">{{ ticket.item.row }}</span></span
              >
              <span class="seat">
                Seat <span data-testid="summary-item-seat">{{ ticket.seat }}</span>
              </span>
              <span class="price" data-testid="summary-item-price">{{ ticket.price }}</span>
              <button
                mat-stroked-button
                type="button"
                data-testid="summary-item-remove-button"
                (click)="remove(ticket.item)"
              >
                Remove
              </button>
            </li>
          }
        </ul>
        <p class="total" data-testid="summary-total">Total: {{ total() }}</p>
        <div class="actions">
          <button mat-stroked-button type="button" data-testid="back-button" (click)="back()">
            Back
          </button>
          <button mat-flat-button type="button" data-testid="confirm-button" (click)="confirm()">
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
      margin: 0;
      padding: 0;
    }
    .ticket {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 10px 0;
      border-bottom: 1px solid #ddd;
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
      font-size: 20px;
      font-weight: 500;
      text-align: right;
    }
    .actions {
      display: flex;
      gap: 16px;
    }
  `,
})
export class SummaryPage implements OnInit {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input.required<string>();

  readonly screening = signal<Screening | null>(null);
  readonly movie = signal<Movie | null>(null);
  readonly loaded = computed(() => this.screening() !== null && this.movie() !== null);

  readonly tickets = computed(() =>
    this.booking.items().map((item) => ({
      item,
      seat: isCouch(item) ? `Couch ${itemLabel(item)}` : itemLabel(item),
      price: formatPrice(itemPrice(item)),
    })),
  );
  readonly total = computed(() => formatPrice(this.booking.total()));

  ngOnInit(): void {
    const subscription = this.api
      .screening(this.id())
      .pipe(
        switchMap((screening) =>
          this.api.movie(screening.movieId).pipe(map((movie) => ({ screening, movie }))),
        ),
      )
      .subscribe({
        next: ({ screening, movie }) => {
          this.screening.set(screening);
          this.movie.set(movie);
        },
        error: () => this.router.navigateByUrl('/'),
      });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  remove(item: SeatItem): void {
    this.booking.remove(item);
    if (this.booking.items().length === 0) this.back();
  }

  back(): void {
    this.router.navigate(['/screenings', this.id(), 'seats']);
  }

  confirm(): void {
    this.router.navigate(['/screenings', this.id(), 'checkout']);
  }
}
