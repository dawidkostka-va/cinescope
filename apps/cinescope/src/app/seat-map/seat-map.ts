import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { AUDITORIUM, Cell, MAX_SEATS, tickets } from '../core/auditorium';
import { Movie, Screening } from '../core/models';
import { showDate } from '../core/dates';
import { ToastService } from '../core/toast';

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

@Component({
  selector: 'app-seat-map',
  imports: [MatButton, NgTemplateOutlet],
  templateUrl: './seat-map.html',
})
export class SeatMap implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  readonly id = input.required<string>();

  protected readonly layout = AUDITORIUM;
  private readonly loaded = signal<{ screening: Screening; movie: Movie } | null>(null);
  protected readonly screening = computed(() => this.loaded()?.screening ?? null);

  protected readonly seats = computed(() => this.bookingService.booking()?.seats ?? []);
  protected readonly selected = computed(() => new Set(this.seats()));
  protected readonly occupied = computed(() => new Set(this.screening()?.occupiedSeats ?? []));
  protected readonly ticketGroups = computed(() => {
    const groups = new Map<number, string[]>();
    for (const ticket of tickets(this.seats())) {
      const label = ticket.kind === 'couch' ? `${ticket.start}-${ticket.end}` : String(ticket.start);
      groups.set(ticket.row, [...(groups.get(ticket.row) ?? []), label]);
    }
    return [...groups.entries()];
  });
  protected readonly subtitle = computed(() => {
    const screening = this.screening();
    return screening ? `Show Date: ${showDate(screening.date, screening.time)}` : '';
  });

  ngOnInit(): void {
    this.api
      .getScreeningWithMovie(Number(this.id()))
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (loaded) => {
          this.loaded.set(loaded);
          const booking = this.bookingService.booking();
          if (!booking || booking.paid || booking.screeningId !== loaded.screening.id) {
            this.bookingService.startNew(loaded.screening.id);
          }
        },
        error: () => void this.router.navigate(['/']),
      });
  }

  protected stateOf(cell: Cell): SeatState {
    if (cell.ids.some((id) => this.occupied().has(id))) {
      return 'unavailable';
    }
    if (this.selected().has(cell.ids[0])) {
      return 'selected';
    }
    return cell.accessible ? 'accessible' : 'available';
  }

  protected toggle(cell: Cell): void {
    const state = this.stateOf(cell);
    if (state === 'unavailable') {
      return;
    }
    if (state === 'selected') {
      this.bookingService.update((booking) => ({
        ...booking,
        seats: booking.seats.filter((id) => !cell.ids.includes(id)),
      }));
      return;
    }
    if (this.seats().length + cell.ids.length > MAX_SEATS) {
      this.toast.show(`Maximum ${MAX_SEATS} seats per booking`);
      return;
    }
    this.bookingService.update((booking) => ({ ...booking, seats: [...booking.seats, ...cell.ids] }));
  }

  protected cancel(): void {
    this.bookingService.set(null);
    void this.router.navigate(['/']);
  }

  protected continue(): void {
    const screening = this.screening();
    if (screening && this.seats().length > 0) {
      void this.router.navigate(['/screenings', screening.id, 'summary']);
    }
  }
}
