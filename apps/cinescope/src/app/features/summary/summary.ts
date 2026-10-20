import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../../core/booking.service';
import { ScreeningData } from '../../core/resolvers';
import { SelectionItem, formatPrice, itemsToSeatIds, priceForItem, seatsToItems, totalPrice } from '../../core/seat-utils';

interface SummaryRow {
  item: SelectionItem;
  seatLabel: string;
  price: string;
}

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly bookingService = inject(BookingService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  readonly data = input.required<ScreeningData>();

  protected readonly seatIds = computed(() => this.bookingService.booking()?.seats ?? []);

  protected readonly rows = computed<SummaryRow[]>(() =>
    seatsToItems(this.seatIds()).map((item) => ({
      item,
      seatLabel: item.type === 'couch' ? `Couch ${item.columnStart}-${item.columnEnd}` : `${item.column}`,
      price: formatPrice(priceForItem(item)),
    })),
  );

  protected readonly total = computed(() => formatPrice(totalPrice(this.seatIds())));
  protected readonly dateTime = computed(() => `${this.data().screening.date} ${this.data().screening.time}`);

  protected remove(item: SelectionItem): void {
    this.bookingService.removeSeats(itemsToSeatIds([item]));
    if (this.seatIds().length === 0) {
      this.router.navigate(['/screenings', this.id(), 'seats']);
    }
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.id(), 'seats']);
  }

  protected confirm(): void {
    this.router.navigate(['/screenings', this.id(), 'checkout']);
  }
}
