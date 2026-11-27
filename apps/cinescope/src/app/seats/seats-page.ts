import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { Api } from '../api';
import { BookingStore } from '../booking';
import { showDate } from '../dates';
import { Screening } from '../models';
import { ToastService } from '../toast';
import {
  MAX_SEATS,
  ROWS,
  SeatItem,
  SeatState,
  isAccessible,
  isCouch,
  itemIds,
  itemLabel,
  lastColumn,
  rowBlocks,
  sameItem,
  seatCount,
} from './seat-layout';

interface Cell {
  item: SeatItem;
  couch: boolean;
  label: string;
  end: number;
  state: SeatState;
}

interface RowView {
  row: number;
  entrance: boolean;
  blocks: Cell[][];
}

const LEGEND: { state: SeatState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

@Component({
  selector: 'app-seats-page',
  imports: [MatButtonModule],
  templateUrl: './seats-page.html',
  styleUrl: './seats-page.scss',
})
export class SeatsPage implements OnInit {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingStore);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input.required<string>();
  readonly legend = LEGEND;

  readonly screening = signal<Screening | null>(null);

  readonly showDate = computed(() => {
    const screening = this.screening();
    return screening ? showDate(screening.date, screening.time) : '';
  });

  private readonly occupied = computed(() => new Set(this.screening()?.occupiedSeats ?? []));
  private readonly selected = this.booking.items;
  readonly selectedCount = computed(() =>
    this.selected().reduce((sum, item) => sum + seatCount(item), 0),
  );

  readonly rows = computed<RowView[]>(() => {
    const occupied = this.occupied();
    const selected = this.selected();
    return Array.from({ length: ROWS }, (_, index) => {
      const { entrance, blocks } = rowBlocks(index + 1);
      return {
        row: index + 1,
        entrance,
        blocks: blocks.map((items) =>
          items.map((item) => ({
            item,
            couch: isCouch(item),
            label: itemLabel(item),
            end: lastColumn(item),
            state: this.stateOf(item, occupied, selected),
          })),
        ),
      };
    });
  });

  readonly selectedRows = computed(() => {
    const byRow = new Map<number, string[]>();
    for (const item of this.selected()) {
      byRow.set(item.row, [...(byRow.get(item.row) ?? []), itemLabel(item)]);
    }
    return [...byRow].map(([row, labels]) => ({ row, text: `Row ${row}: ${labels.join(', ')}` }));
  });

  ngOnInit(): void {
    const subscription = this.api
      .screening(this.id())
      .pipe(
        switchMap((screening) =>
          this.api.movie(screening.movieId).pipe(
            catchError(() => of(null)),
            switchMap(() => of(screening)),
          ),
        ),
      )
      .subscribe({
        next: (screening) => {
          if (this.booking.screeningId() !== screening.id || this.booking.paid()) {
            this.booking.startNew(screening.id);
          }
          this.screening.set(screening);
        },
        error: () => this.router.navigateByUrl('/'),
      });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  toggle(item: SeatItem): void {
    const state = this.stateOf(item, this.occupied(), this.selected());
    if (state === 'unavailable') return;
    if (state !== 'selected' && this.selectedCount() + seatCount(item) > MAX_SEATS) {
      this.toast.show('Maximum 10 seats per booking');
      return;
    }
    this.booking.toggle(item);
  }

  cancel(): void {
    this.booking.clear();
    this.router.navigateByUrl('/');
  }

  next(): void {
    const screening = this.screening();
    if (screening && this.selected().length > 0) {
      this.router.navigate(['/screenings', screening.id, 'summary']);
    }
  }

  private stateOf(item: SeatItem, occupied: Set<string>, selected: SeatItem[]): SeatState {
    if (itemIds(item).some((id) => occupied.has(id))) return 'unavailable';
    if (selected.some((s) => sameItem(s, item))) return 'selected';
    return isAccessible(item) ? 'accessible' : 'available';
  }
}
