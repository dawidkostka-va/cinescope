import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingService } from '../../core/booking.service';
import { injectResolvedScreening } from '../../core/screening-resolver';
import { SeatUnit, formatPrice, seatUnitLabel, toSeatUnits } from '../../core/seat.util';

interface SummaryItemVm {
  unit: SeatUnit;
  row: number;
  seatLabel: string;
  priceLabel: string;
}

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
})
export class SummaryComponent {
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);

  private readonly data = injectResolvedScreening();

  readonly screening = computed(() => this.data().screening);
  readonly movie = computed(() => this.data().movie);
  readonly dateTime = computed(() => `${this.screening().date} ${this.screening().time}`);

  private readonly booking = this.bookingService.booking;
  private readonly seats = computed(() => this.booking()?.seats ?? []);

  readonly items = computed<SummaryItemVm[]>(() =>
    toSeatUnits(this.seats()).map((unit) => ({
      unit,
      row: unit.row,
      seatLabel: unit.type === 'couch' ? `Couch ${seatUnitLabel(unit)}` : seatUnitLabel(unit),
      priceLabel: formatPrice(unit.price),
    })),
  );

  readonly totalLabel = computed(() => formatPrice(this.items().reduce((sum, item) => sum + item.unit.price, 0)));

  remove(unit: SeatUnit): void {
    this.bookingService.removeUnit(unit);
    if ((this.booking()?.seats.length ?? 0) === 0) {
      this.router.navigate(['/screenings', this.screening().id, 'seats']);
    }
  }

  back(): void {
    this.router.navigate(['/screenings', this.screening().id, 'seats']);
  }

  confirm(): void {
    this.router.navigate(['/screenings', this.screening().id, 'checkout']);
  }
}
