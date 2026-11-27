import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, catchError, map, switchMap } from 'rxjs';
import { BookingStore, SelectedUnit, describeSeat, sortUnits, unitKey } from '../booking';
import { formatPrice, priceOf } from '../pricing';
import { LoadedScreening, ScreeningLoader } from '../screening-loader';

/** One summary item: a seat or a couch of the booking, with its details. */
interface SummaryItem {
  key: string;
  unit: SelectedUnit;
  movieTitle: string;
  dateTime: string;
  row: number;
  seat: string;
  price: string;
}

/** `Your tickets` (section 6): the booking's seats and couches, with the total and the way on. */
@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly booking = inject(BookingStore);
  private readonly screenings = inject(ScreeningLoader);

  /** Null until the screening and its movie have loaded. */
  protected readonly view = signal<LoadedScreening | null>(null);

  /** Seats and couches of the booking in progress; changed by `Remove`. */
  protected readonly units = signal<SelectedUnit[]>(this.booking.read()?.units ?? []);

  protected readonly items = computed<SummaryItem[]>(() => {
    const loaded = this.view();
    if (!loaded) {
      return [];
    }
    return sortUnits(this.units()).map((unit) => ({
      key: unitKey(unit.row, unit.start),
      unit,
      movieTitle: loaded.movie.title,
      dateTime: `${loaded.screening.date} ${loaded.screening.time}`,
      row: unit.row,
      seat: describeSeat(unit),
      price: formatPrice(priceOf(unit)),
    }));
  });

  protected readonly totalLabel = computed(() =>
    formatPrice(this.units().reduce((total, unit) => total + priceOf(unit), 0)),
  );

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id') ?? ''),
        switchMap((id) =>
          this.screenings.load(id).pipe(
            catchError(() => {
              this.router.navigate(['/']);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((loaded) => this.view.set(loaded));
  }

  /** Takes one seat or couch out of the booking; removing the last one returns to the seat map. */
  protected remove(unit: SelectedUnit): void {
    const loaded = this.view();
    if (!loaded) {
      return;
    }
    const key = unitKey(unit.row, unit.start);
    const remaining = this.units().filter((other) => unitKey(other.row, other.start) !== key);
    this.units.set(remaining);
    this.booking.update({ units: remaining });
    if (remaining.length === 0) {
      this.router.navigate(['/screenings', loaded.screening.id, 'seats']);
    }
  }

  protected back(): void {
    const loaded = this.view();
    if (loaded) {
      this.router.navigate(['/screenings', loaded.screening.id, 'seats']);
    }
  }

  protected confirm(): void {
    const loaded = this.view();
    if (loaded) {
      this.router.navigate(['/screenings', loaded.screening.id, 'checkout']);
    }
  }
}
