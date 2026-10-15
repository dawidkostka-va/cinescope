import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { BookingService } from '../../core/booking.service';
import { Movie, Screening } from '../../core/models';
import { SelectionUnit, formatPrice, getSelectionUnits, totalPrice, unitSeatIds } from '../../core/seat-utils';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
})
export class SummaryComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly bookingService = inject(BookingService);

  private readonly paramMap = toSignal(this.route.paramMap, { requireSync: true });
  protected readonly screeningId = computed(() => Number(this.paramMap().get('id')));

  protected readonly screening = signal<Screening | null>(null);
  protected readonly movie = signal<Movie | null>(null);

  protected readonly booking = this.bookingService.booking;

  protected readonly units = computed<SelectionUnit[]>(() => getSelectionUnits(this.booking()?.seats ?? []));
  protected readonly total = computed(() => formatPrice(totalPrice(this.booking()?.seats ?? [])));

  constructor() {
    effect(() => {
      const id = this.screeningId();
      this.api.getScreening(id).subscribe({
        next: (screening) => {
          this.screening.set(screening);
          this.api.getMovie(screening.movieId).subscribe({
            next: (movie) => this.movie.set(movie),
            error: () => this.router.navigateByUrl('/'),
          });
        },
        error: () => this.router.navigateByUrl('/'),
      });
    });
  }

  protected seatLabel(unit: SelectionUnit): string {
    return unit.type === 'couch' ? `Couch ${unit.columnStart}-${unit.columnEnd}` : String(unit.column);
  }

  protected priceLabel(unit: SelectionUnit): string {
    return formatPrice(unit.price);
  }

  protected dateTime(): string {
    const screening = this.screening();
    return screening ? `${screening.date} ${screening.time}` : '';
  }

  protected remove(unit: SelectionUnit): void {
    const idsToRemove = new Set(unitSeatIds(unit));
    const remaining = (this.booking()?.seats ?? []).filter((id) => !idsToRemove.has(id));
    this.bookingService.setSeats(remaining);
    if (remaining.length === 0) {
      this.router.navigate(['/screenings', this.screeningId(), 'seats']);
    }
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.screeningId(), 'seats']);
  }

  protected confirm(): void {
    this.router.navigate(['/screenings', this.screeningId(), 'checkout']);
  }
}
