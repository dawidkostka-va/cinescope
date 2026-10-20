import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import {
  LEGEND_ITEMS,
  SeatState,
  formatPrice,
  getRowSlots,
  groupSelectedByRow,
  isAccessible,
  priceForRow,
  seatId,
} from '../core/auditorium';
import { BookingService } from '../core/booking.service';
import { formatShowDate } from '../core/date-utils';
import { Screening } from '../core/models';
import { ToastService } from '../core/toast.service';

interface EmptySlotView {
  kind: 'empty';
  columns: number;
}

interface AisleSlotView {
  kind: 'aisle';
}

interface SeatSlotView {
  kind: 'seat';
  row: number;
  column: number;
  id: string;
  state: SeatState;
  price: number;
}

interface CouchSlotView {
  kind: 'couch';
  row: number;
  columnStart: number;
  columnEnd: number;
  id1: string;
  id2: string;
  state: SeatState;
  price: number;
}

type SlotView = EmptySlotView | AisleSlotView | SeatSlotView | CouchSlotView;

interface RowView {
  row: number;
  slots: SlotView[];
}

@Component({
  selector: 'app-seat-selection',
  imports: [MatButtonModule],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss',
})
export class SeatSelection {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  protected readonly legendItems = LEGEND_ITEMS;

  private readonly paramMap = toSignal(this.route.paramMap, { requireSync: true });
  protected readonly screeningId = computed(() => Number(this.paramMap().get('id')));
  protected readonly screening = signal<Screening | null>(null);

  protected readonly showDateText = computed(() => {
    const screening = this.screening();
    return screening ? formatShowDate(screening.date, screening.time) : '';
  });

  protected readonly selectedSeats = computed(() => {
    const booking = this.bookingService.booking();
    return booking && booking.screeningId === this.screeningId() ? booking.seats : [];
  });

  protected readonly rows = computed<RowView[]>(() => {
    const screening = this.screening();
    const occupied = new Set(screening?.occupiedSeats ?? []);
    const selected = new Set(this.selectedSeats());
    const result: RowView[] = [];
    for (let row = 1; row <= 15; row++) {
      const slots = getRowSlots(row).map((slot): SlotView => {
        if (slot.kind === 'empty') {
          return { kind: 'empty', columns: slot.columns };
        }
        if (slot.kind === 'aisle') {
          return { kind: 'aisle' };
        }
        if (slot.kind === 'seat') {
          const id = seatId(row, slot.column);
          const state: SeatState = occupied.has(id)
            ? 'unavailable'
            : selected.has(id)
              ? 'selected'
              : isAccessible(row, slot.column)
                ? 'accessible'
                : 'available';
          return { kind: 'seat', row, column: slot.column, id, state, price: priceForRow(row) };
        }
        const id1 = seatId(row, slot.columnStart);
        const id2 = seatId(row, slot.columnEnd);
        const state: SeatState = occupied.has(id1) || occupied.has(id2) ? 'unavailable' : selected.has(id1) && selected.has(id2) ? 'selected' : 'available';
        return { kind: 'couch', row, columnStart: slot.columnStart, columnEnd: slot.columnEnd, id1, id2, state, price: priceForRow(row) };
      });
      result.push({ row, slots });
    }
    return result;
  });

  protected readonly selectedByRow = computed(() => groupSelectedByRow(this.selectedSeats()));

  constructor() {
    effect(() => {
      const id = this.screeningId();
      this.loadScreening(id);
    });
  }

  private loadScreening(id: number): void {
    this.screening.set(null);
    this.api.getScreening(id).subscribe({
      next: (screening) => {
        this.screening.set(screening);
        const booking = this.bookingService.booking();
        if (!booking || booking.paid || booking.screeningId !== id) {
          this.bookingService.startNew(id);
        }
      },
      error: () => {
        this.router.navigateByUrl('/');
      },
    });
  }

  protected onSeatClick(slot: SeatSlotView): void {
    if (slot.state === 'unavailable') {
      return;
    }
    const current = this.selectedSeats();
    if (slot.state === 'selected') {
      this.bookingService.setSeats(current.filter((id) => id !== slot.id));
      return;
    }
    if (current.length + 1 > 10) {
      this.toast.show('Maximum 10 seats per booking');
      return;
    }
    this.bookingService.setSeats([...current, slot.id]);
  }

  protected onCouchClick(slot: CouchSlotView): void {
    if (slot.state === 'unavailable') {
      return;
    }
    const current = this.selectedSeats();
    if (slot.state === 'selected') {
      this.bookingService.setSeats(current.filter((id) => id !== slot.id1 && id !== slot.id2));
      return;
    }
    if (current.length + 2 > 10) {
      this.toast.show('Maximum 10 seats per booking');
      return;
    }
    this.bookingService.setSeats([...current, slot.id1, slot.id2]);
  }

  protected onCancel(): void {
    this.bookingService.clear();
    this.router.navigateByUrl('/');
  }

  protected onContinue(): void {
    if (this.selectedSeats().length === 0) {
      return;
    }
    this.router.navigate(['/screenings', this.screeningId(), 'summary']);
  }

  protected readonly formatPrice = formatPrice;
}
