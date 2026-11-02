import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { Api } from '../api';
import { BookingService } from '../booking';
import { Screening } from '../models';
import { AUDITORIUM, Cell, formatShowDate, itemsFromIds, MAX_SEATS, SeatState } from '../seat-utils';
import { ToastService } from '../toast';

type SelectableCell = Extract<Cell, { kind: 'seat' | 'couch' }>;

@Component({
  selector: 'app-seat-map',
  imports: [MatButtonModule],
  templateUrl: './seat-map.html',
  styleUrl: './seat-map.scss',
})
export class SeatMap {
  private api = inject(Api);
  private router = inject(Router);
  private booking = inject(BookingService);
  private toast = inject(ToastService);
  private id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected rows = AUDITORIUM;
  protected legend: { state: SeatState; label: string }[] = [
    { state: 'available', label: 'Available' },
    { state: 'selected', label: 'Selected' },
    { state: 'unavailable', label: 'Unavailable' },
    { state: 'accessible', label: 'Accessible' },
  ];

  protected screening = signal<Screening | null>(null);

  private occupied = computed(() => new Set(this.screening()?.occupiedSeats ?? []));
  private selectedIds = computed(() => {
    const b = this.booking.booking();
    return new Set(b && b.screeningId === this.screening()?.id && !b.paid ? b.seats : []);
  });

  protected showDate = computed(() => {
    const s = this.screening();
    return s ? formatShowDate(s.date, s.time) : '';
  });

  protected states = computed(() => {
    const occupied = this.occupied();
    const selected = this.selectedIds();
    const map = new Map<string, SeatState>();
    for (const row of this.rows) {
      for (const cell of row.cells) {
        if (cell.kind !== 'seat' && cell.kind !== 'couch') continue;
        let state: SeatState = 'available';
        if (cell.ids.some((i) => occupied.has(i))) state = 'unavailable';
        else if (cell.ids.every((i) => selected.has(i))) state = 'selected';
        else if (cell.kind === 'seat' && cell.accessible) state = 'accessible';
        map.set(cell.key, state);
      }
    }
    return map;
  });

  protected count = computed(() => this.selectedIds().size);

  protected rowSummary = computed(() => {
    const byRow = new Map<number, string[]>();
    for (const item of itemsFromIds([...this.selectedIds()])) {
      byRow.set(item.row, [...(byRow.get(item.row) ?? []), item.couch ? `${item.start}-${item.end}` : `${item.start}`]);
    }
    return [...byRow].map(([row, seats]) => ({ row, text: seats.join(', ') }));
  });

  constructor() {
    this.api
      .screening(this.id)
      .pipe(
        switchMap((screening) =>
          this.api.movie(screening.movieId).pipe(
            catchError(() => of(null)),
            switchMap(() => of(screening)),
          ),
        ),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe({
        next: (screening) => {
          const b = this.booking.booking();
          if (!b || b.paid || b.screeningId !== screening.id) this.booking.start(screening.id);
          this.screening.set(screening);
        },
        error: () => this.router.navigateByUrl('/'),
      });
  }

  protected toggle(cell: SelectableCell): void {
    const state = this.states().get(cell.key);
    const current = this.booking.booking()?.seats ?? [];
    if (state === 'selected') {
      this.booking.setSeats(current.filter((i) => !cell.ids.includes(i)));
    } else if (state !== 'unavailable') {
      if (current.length + cell.ids.length > MAX_SEATS) {
        this.toast.show('Maximum 10 seats per booking');
        return;
      }
      this.booking.setSeats([...current, ...cell.ids]);
    }
  }

  protected cancel(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }

  protected next(): void {
    if (this.count() === 0) return;
    this.router.navigate(['/screenings', this.id, 'summary']);
  }
}
