import { Component, computed, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { formatShowDate } from '../date';
import { BookingService } from '../booking/booking.service';
import { loadScreeningWithMovie } from '../screening/screening-data';
import { ToastService } from '../toast/toast.service';
import { AuditoriumRow, buildAuditorium, SeatState } from './auditorium';
import { describeSelection, MAX_SEATS } from './selection';

@Component({
  selector: 'app-seat-map',
  imports: [MatButtonModule],
  templateUrl: './seat-map.html',
  styleUrl: './seat-map.scss',
})
export class SeatMap {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly bookings = inject(BookingService);
  private readonly screeningId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('id'))),
    { requireSync: true },
  );

  private readonly data = loadScreeningWithMovie(this.screeningId);
  protected readonly screening = this.data.screening;
  protected readonly showDate = computed(() => {
    const screening = this.screening();
    return screening ? formatShowDate(screening.date, screening.time) : '';
  });
  protected readonly rows = computed<AuditoriumRow[]>(() =>
    buildAuditorium(new Set(this.screening()?.occupiedSeats ?? [])),
  );

  protected readonly selected = computed<ReadonlySet<string>>(() => {
    const booking = this.bookings.booking();
    const screening = this.screening();
    const matches = booking?.paidEmail === null && booking.screeningId === screening?.id;
    return matches ? new Set(booking.seats) : new Set();
  });
  protected readonly selectedCount = computed(() => this.selected().size);
  protected readonly selectionLines = computed(() => describeSelection(this.selected()));

  protected readonly legend: { state: SeatState; label: string }[] = [
    { state: 'available', label: 'Available' },
    { state: 'selected', label: 'Selected' },
    { state: 'unavailable', label: 'Unavailable' },
    { state: 'accessible', label: 'Accessible' },
  ];

  constructor() {
    effect(() => {
      const screening = this.screening();
      if (screening) {
        untracked(() => this.bookings.openSeatMap(screening.id));
      }
    });
    effect(() => {
      if (this.data.failed()) {
        this.router.navigateByUrl('/', { replaceUrl: true });
      }
    });
  }

  protected stateOf(state: SeatState, ids: readonly string[]): SeatState {
    if (state === 'unavailable') {
      return state;
    }
    return ids.every((id) => this.selected().has(id)) ? 'selected' : state;
  }

  protected toggle(ids: readonly string[]): void {
    const current = this.selected();
    const next = new Set(current);
    if (ids.every((id) => current.has(id))) {
      ids.forEach((id) => next.delete(id));
    } else if (current.size + ids.length > MAX_SEATS) {
      this.toast.show(`Maximum ${MAX_SEATS} seats per booking`);
      return;
    } else {
      ids.forEach((id) => next.add(id));
    }
    this.bookings.setSeats([...next]);
  }

  protected cancel(): void {
    this.bookings.clear();
    this.router.navigateByUrl('/');
  }

  protected proceed(): void {
    this.router.navigateByUrl(`/screenings/${this.screeningId()}/summary`);
  }
}
