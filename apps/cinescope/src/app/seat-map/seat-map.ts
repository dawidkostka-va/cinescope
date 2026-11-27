import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { showDate } from '../core/dates';
import { Screening } from '../core/models';
import { AUDITORIUM, Cell, MAX_SEATS, SeatState, describeTicket } from '../core/seats';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-seat-map',
  imports: [MatButtonModule],
  templateUrl: './seat-map.html',
  styleUrl: './seat-map.scss',
})
export class SeatMap {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly booking = inject(BookingService);
  private readonly toast = inject(ToastService);

  protected readonly rows = AUDITORIUM;
  protected readonly legend: { state: SeatState; label: string }[] = [
    { state: 'available', label: 'Available' },
    { state: 'selected', label: 'Selected' },
    { state: 'unavailable', label: 'Unavailable' },
    { state: 'accessible', label: 'Accessible' },
  ];

  protected readonly screening = signal<Screening | null>(null);
  protected readonly subtitle = computed(() => {
    const s = this.screening();
    return s ? showDate(s.date, s.time) : '';
  });

  private readonly occupied = computed(() => new Set(this.screening()?.occupiedSeats ?? []));
  private readonly selected = computed(() => new Set(this.booking.booking()?.seats ?? []));

  protected readonly selectedCount = computed(() => this.selected().size);
  protected readonly selectedRows = computed(() => {
    const byRow = new Map<number, string[]>();
    for (const ticket of this.booking.tickets()) {
      byRow.set(ticket.row, [...(byRow.get(ticket.row) ?? []), describeTicket(ticket)]);
    }
    return [...byRow].map(([row, seats]) => ({ row, text: seats.join(', ') }));
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id') ?? ''),
        switchMap((id) =>
          this.api.screening(id).pipe(
            switchMap((screening) =>
              this.api.movie(screening.movieId).pipe(
                catchError(() => of(null)),
                map(() => screening),
              ),
            ),
          ),
        ),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe({
        next: (screening) => {
          if (!this.booking.isInProgressFor(screening.id)) {
            this.booking.start(screening.id);
          }
          this.screening.set(screening);
        },
        error: () => this.router.navigateByUrl('/'),
      });
  }

  protected stateOf(cell: Cell): SeatState {
    if (cell.ids.some((id) => this.occupied().has(id))) {
      return 'unavailable';
    }
    if (cell.ids.every((id) => this.selected().has(id))) {
      return 'selected';
    }
    return cell.accessible ? 'accessible' : 'available';
  }

  protected toggle(cell: Cell): void {
    const state = this.stateOf(cell);
    if (state === 'unavailable') {
      return;
    }
    const current = this.booking.booking()?.seats ?? [];
    if (state === 'selected') {
      this.booking.setSeats(current.filter((id) => !cell.ids.includes(id)));
    } else if (current.length + cell.ids.length > MAX_SEATS) {
      this.toast.show(`Maximum ${MAX_SEATS} seats per booking`);
    } else {
      this.booking.setSeats([...current, ...cell.ids]);
    }
  }

  protected cancel(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }

  protected next(): void {
    const screening = this.screening();
    if (screening && this.selectedCount() > 0) {
      this.router.navigate(['/screenings', screening.id, 'summary']);
    }
  }
}
