import { Component, computed, effect, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { BookingService, SelectedUnit, sortedUnits } from '../booking.service';
import { CinemaApi } from '../cinema-api';
import { formatPrice, totalOf, unitPrice } from '../pricing';

@Component({
  selector: 'app-summary',
  imports: [MatButton],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly booking = inject(BookingService);

  private readonly screeningId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id')))),
    { requireSync: true },
  );

  protected readonly data = rxResource({
    params: () => this.screeningId(),
    stream: ({ params: id }) => this.api.screeningWithMovie(id),
  });

  protected readonly view = computed(() => {
    if (this.data.error()) {
      return undefined;
    }
    const value = this.data.value();
    if (!value) {
      return undefined;
    }
    return {
      title: value.movie.title,
      dateTime: `${value.screening.date} ${value.screening.time}`,
    };
  });

  protected readonly items = computed(() =>
    sortedUnits(this.booking.units()).map((unit) => ({
      key: `${unit.row}-${unit.column}-${unit.couch}`,
      unit,
      row: unit.row,
      seat: unit.couch ? `Couch ${unit.column}-${unit.column + 1}` : `${unit.column}`,
      price: formatPrice(unitPrice(unit)),
    })),
  );

  protected readonly total = computed(() => formatPrice(totalOf(this.booking.units())));

  constructor() {
    effect(() => {
      if (this.data.error()) {
        void this.router.navigate(['/']);
      }
    });
  }

  protected remove(unit: SelectedUnit): void {
    this.booking.remove(unit);
    if (this.booking.seatCount() === 0) {
      this.toSeats();
    }
  }

  protected back(): void {
    this.toSeats();
  }

  protected confirm(): void {
    void this.router.navigate(['/screenings', this.screeningId(), 'checkout']);
  }

  private toSeats(): void {
    void this.router.navigate(['/screenings', this.screeningId(), 'seats']);
  }
}
