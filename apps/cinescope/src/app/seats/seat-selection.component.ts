import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { catchError, EMPTY, map, switchMap, tap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { buildAuditorium, CouchItem, SeatItem } from '../core/auditorium';
import { BookingService } from '../core/booking.service';
import { showDate } from '../core/dates';
import { Movie, Screening } from '../core/models';
import { MAX_SEATS_PER_BOOKING, toUnits, unitLabel } from '../core/seat-units';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-seat-selection',
  imports: [MatButtonModule],
  templateUrl: './seat-selection.component.html',
  styleUrl: './seat-selection.component.scss',
})
export class SeatSelectionComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly bookings = inject(BookingService);

  readonly screening = signal<Screening | null>(null);
  readonly movie = signal<Movie | null>(null);
  readonly selected = computed<ReadonlySet<string>>(() => new Set(this.bookings.booking()?.seats ?? []));

  readonly subtitle = computed(() => {
    const screening = this.screening();
    return screening ? `Show Date: ${showDate(screening.date, screening.time)}` : '';
  });
  readonly rows = computed(() =>
    buildAuditorium(new Set(this.screening()?.occupiedSeats ?? []), this.selected()),
  );
  readonly selectedCount = computed(() => this.selected().size);
  readonly selectedRows = computed(() => {
    const rows = new Map<number, string[]>();
    for (const unit of toUnits([...this.selected()])) {
      rows.set(unit.row, [...(rows.get(unit.row) ?? []), unitLabel(unit)]);
    }
    return [...rows.entries()].map(([row, labels]) => ({ row, label: labels.join(', ') }));
  });

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
        tap(({ screening }) => this.bookings.open(screening.id)),
        takeUntilDestroyed(),
      )
      .subscribe(({ screening, movie }) => {
        this.screening.set(screening);
        this.movie.set(movie);
      });
  }

  toggle(item: SeatItem | CouchItem): void {
    if (item.state === 'unavailable') {
      return;
    }
    const selected = new Set(this.selected());
    if (item.state === 'selected') {
      item.ids.forEach((id) => selected.delete(id));
    } else {
      if (selected.size + item.ids.length > MAX_SEATS_PER_BOOKING) {
        this.toast.show(`Maximum ${MAX_SEATS_PER_BOOKING} seats per booking`);
        return;
      }
      item.ids.forEach((id) => selected.add(id));
    }
    this.bookings.setSeats([...selected]);
  }

  cancel(): void {
    this.bookings.clear();
    this.router.navigateByUrl('/');
  }

  goToSummary(): void {
    const screening = this.screening();
    if (screening && this.selectedCount() > 0) {
      this.router.navigate(['/screenings', screening.id, 'summary']);
    }
  }
}
