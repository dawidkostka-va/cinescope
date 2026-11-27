import { Component, computed, effect, inject, resource } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { BookingStore } from '../booking/booking';
import { CinemaApi } from '../cinema-api';
import { formatShowDate } from '../dates';
import { Toaster } from '../toast/toast';
import { AuditoriumItem, buildAuditorium, identifiersOf, seatLabel, SeatState } from './auditorium';

const MAX_SEATS_PER_BOOKING = 10;

@Component({
  selector: 'app-seat-selection',
  imports: [MatButton],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss',
})
export class SeatSelection {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toaster = inject(Toaster);
  private readonly bookings = inject(BookingStore);

  private readonly params = toSignal(this.route.paramMap, { requireSync: true });
  private readonly screeningId = computed(() => Number(this.params().get('id')));

  protected readonly data = resource({
    params: () => this.screeningId(),
    loader: async ({ params: id }) => {
      const screening = await firstValueFrom(this.api.getScreening(id));
      // Keeps the booking in progress if it belongs to this screening, otherwise starts an empty one.
      this.bookings.openFor(screening.id);
      const movie = await firstValueFrom(this.api.getMovie(screening.movieId));
      return { screening, movie };
    },
  });

  /** Identifiers of the selected seats of the booking for this screening; a couch contributes both of its identifiers. */
  protected readonly selected = computed<ReadonlySet<string>>(() => {
    const booking = this.bookings.booking();
    return new Set(booking !== null && booking.screeningId === this.screeningId() ? booking.seats : []);
  });

  protected readonly selectedCount = computed(() => this.selected().size);

  protected readonly rows = computed(() => {
    const screening = this.data.value()?.screening;
    return buildAuditorium(new Set(screening?.occupiedSeats ?? []), this.selected());
  });

  /** One line per row with a selection, in ascending row order. */
  protected readonly selectedRows = computed(() =>
    this.rows()
      .map((row) => ({
        row: row.number,
        seats: row.blocks.flat().filter((item) => item.state === 'selected').map(seatLabel),
      }))
      .filter((line) => line.seats.length > 0)
      .map((line) => ({ row: line.row, text: `Row ${line.row}: ${line.seats.join(', ')}` })),
  );

  protected readonly legend: { state: SeatState; label: string }[] = [
    { state: 'available', label: 'Available' },
    { state: 'selected', label: 'Selected' },
    { state: 'unavailable', label: 'Unavailable' },
    { state: 'accessible', label: 'Accessible' },
  ];

  constructor() {
    // A screening that cannot be loaded (404 or any other failure) sends the customer back to the movie list.
    effect(() => {
      if (this.data.error()) {
        void this.router.navigate(['/']);
      }
    });
  }

  protected showDate(date: string, time: string): string {
    return formatShowDate(date, time);
  }

  protected toggle(item: AuditoriumItem): void {
    if (item.state === 'unavailable') {
      return;
    }
    const identifiers = identifiersOf(item);
    const current = this.selected();
    if (item.state === 'selected') {
      this.bookings.setSeats([...current].filter((id) => !identifiers.includes(id)));
      return;
    }
    if (current.size + identifiers.length > MAX_SEATS_PER_BOOKING) {
      this.toaster.show(`Maximum ${MAX_SEATS_PER_BOOKING} seats per booking`);
      return;
    }
    this.bookings.setSeats([...current, ...identifiers]);
  }

  protected onCancel(): void {
    this.bookings.clear();
    void this.router.navigate(['/']);
  }

  protected onContinue(): void {
    if (this.selectedCount() === 0) {
      return;
    }
    void this.router.navigate(['/screenings', this.screeningId(), 'summary']);
  }
}
