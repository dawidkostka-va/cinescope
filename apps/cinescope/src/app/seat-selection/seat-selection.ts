import { Component, computed, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, tap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { showDate } from '../core/dates';
import { Screening } from '../core/models';
import {
  COUCH_ROW,
  MAX_SEATS,
  ROW_COUNT,
  SeatState,
  Ticket,
  couchTicket,
  gridColumn,
  isAccessible,
  seatTicket,
} from '../core/seats';
import { ToastService } from '../core/toast.service';

interface RowLayout {
  row: number;
  tickets: Ticket[];
}

const LAYOUT: RowLayout[] = Array.from({ length: ROW_COUNT }, (_, i) => {
  const row = i + 1;
  const tickets: Ticket[] = [];
  if (row === COUCH_ROW) {
    for (let start = 1; start <= 24; start += 2) tickets.push(couchTicket(row, start));
  } else {
    for (let column = row <= 10 ? 5 : 1; column <= 24; column++) tickets.push(seatTicket(row, column));
  }
  return { row, tickets };
});

const LEGEND: { state: SeatState; label: string }[] = [
  { state: 'available', label: 'Available' },
  { state: 'selected', label: 'Selected' },
  { state: 'unavailable', label: 'Unavailable' },
  { state: 'accessible', label: 'Accessible' },
];

@Component({
  selector: 'app-seat-selection',
  imports: [MatButton],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.scss',
})
export class SeatSelection {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly layout = LAYOUT;
  protected readonly legend = LEGEND;
  protected readonly gridColumn = gridColumn;

  protected readonly screening = signal<Screening | null>(null);
  protected readonly loaded = signal(false);

  protected readonly subtitle = computed(() => {
    const s = this.screening();
    return s ? `Show Date: ${showDate(s.date, s.time)}` : '';
  });

  private readonly occupied = computed(() => new Set(this.screening()?.occupiedSeats ?? []));
  private readonly selected = computed(() => new Set(this.bookingService.booking()?.seats ?? []));

  protected readonly selectedCount = computed(() => this.selected().size);
  protected readonly summaryRows = computed(() => {
    const byRow = new Map<number, string[]>();
    for (const t of this.bookingService.tickets()) {
      const label = t.couch ? `${t.start}-${t.end}` : String(t.start);
      byRow.set(t.row, [...(byRow.get(t.row) ?? []), label]);
    }
    return [...byRow].map(([row, labels]) => ({ row, text: `Row ${row}: ${labels.join(', ')}` }));
  });

  constructor() {
    this.api
      .screening(this.id)
      .pipe(
        tap((screening) => {
          this.bookingService.startIfNeeded(screening.id);
          this.screening.set(screening);
        }),
        switchMap((screening) => this.api.movie(screening.movieId)),
      )
      .subscribe({
        next: () => this.loaded.set(true),
        error: () => this.router.navigateByUrl('/'),
      });
  }

  protected state(ticket: Ticket): SeatState {
    if (ticket.ids.some((id) => this.occupied().has(id))) return 'unavailable';
    if (this.selected().has(ticket.ids[0])) return 'selected';
    if (!ticket.couch && isAccessible(ticket.row, ticket.start)) return 'accessible';
    return 'available';
  }

  protected toggle(ticket: Ticket): void {
    const state = this.state(ticket);
    if (state === 'unavailable') return;
    const current = this.bookingService.booking()?.seats ?? [];
    if (state === 'selected') {
      this.bookingService.setSeats(current.filter((id) => !ticket.ids.includes(id)));
    } else if (current.length + ticket.ids.length > MAX_SEATS) {
      this.toast.show('Maximum 10 seats per booking');
    } else {
      this.bookingService.setSeats([...current, ...ticket.ids]);
    }
  }

  protected cancel(): void {
    this.bookingService.clear();
    this.router.navigateByUrl('/');
  }

  protected next(): void {
    if (this.selectedCount() > 0) this.router.navigate(['/screenings', this.id, 'summary']);
  }
}
