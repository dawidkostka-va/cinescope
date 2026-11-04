import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { BookingService } from '../booking/booking.service';
import { formatPrice, unitPrice } from '../seat-map/pricing';
import { selectionUnits } from '../seat-map/selection';
import { loadScreeningWithMovie } from '../screening/screening-data';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly router = inject(Router);
  private readonly bookings = inject(BookingService);
  private readonly screeningId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('id'))),
    { requireSync: true },
  );

  private readonly data = loadScreeningWithMovie(this.screeningId);
  protected readonly screening = this.data.screening;
  protected readonly movie = this.data.movie;

  protected readonly items = computed(() =>
    selectionUnits(new Set(this.bookings.booking()?.seats ?? [])).map((unit) => ({
      unit,
      price: unitPrice(unit),
      key: unit.ids.join(','),
      seat: unit.startColumn === unit.endColumn ? `${unit.startColumn}` : `Couch ${unit.startColumn}-${unit.endColumn}`,
    })),
  );
  protected readonly total = computed(() => formatPrice(this.items().reduce((sum, item) => sum + item.price, 0)));

  constructor() {
    effect(() => {
      if (this.data.failed()) {
        this.router.navigateByUrl('/', { replaceUrl: true });
      }
    });
  }

  protected remove(ids: readonly string[]): void {
    const seats = (this.bookings.booking()?.seats ?? []).filter((id) => !ids.includes(id));
    this.bookings.setSeats(seats);
    if (seats.length === 0) {
      this.router.navigateByUrl(`/screenings/${this.screeningId()}/seats`);
    }
  }

  protected back(): void {
    this.router.navigateByUrl(`/screenings/${this.screeningId()}/seats`);
  }

  protected confirm(): void {
    this.router.navigateByUrl(`/screenings/${this.screeningId()}/checkout`);
  }

  protected formatPrice = formatPrice;
}
