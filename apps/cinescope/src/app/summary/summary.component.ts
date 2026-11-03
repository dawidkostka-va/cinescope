import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { catchError, EMPTY, map, switchMap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { Movie, Screening } from '../core/models';
import { formatPrice, unitPrice } from '../core/pricing';
import { bookingTotal, SeatUnit, toUnits, unitDescription } from '../core/seat-units';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
})
export class SummaryComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookings = inject(BookingService);

  readonly screening = signal<Screening | null>(null);
  readonly movie = signal<Movie | null>(null);
  readonly seats = computed(() => this.bookings.booking()?.seats ?? []);
  readonly units = computed(() => toUnits(this.seats()));
  readonly total = computed(() => formatPrice(bookingTotal(this.seats(), unitPrice)));

  readonly describe = unitDescription;
  readonly price = (unit: SeatUnit) => formatPrice(unitPrice(unit));

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('id'))),
        switchMap((id) =>
          this.api.screeningWithMovie(id).pipe(
            catchError(() => {
              this.router.navigateByUrl('/');
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ screening, movie }) => {
        this.screening.set(screening);
        this.movie.set(movie);
      });
  }

  remove(unit: SeatUnit): void {
    const remaining = this.seats().filter((id) => !unit.ids.includes(id));
    this.bookings.setSeats(remaining);
    if (remaining.length === 0) {
      this.back();
    }
  }

  back(): void {
    this.router.navigate(['/screenings', this.screening()?.id, 'seats']);
  }

  confirm(): void {
    this.router.navigate(['/screenings', this.screening()?.id, 'checkout']);
  }
}
