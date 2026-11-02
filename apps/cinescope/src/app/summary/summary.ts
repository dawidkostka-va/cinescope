import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { Ticket, formatPrice, ticketSeatLabel, tickets } from '../core/auditorium';
import { Movie, Screening } from '../core/models';

@Component({
  selector: 'app-summary',
  imports: [MatButton],
  templateUrl: './summary.html',
})
export class Summary implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);

  readonly id = input.required<string>();

  private readonly loaded = signal<{ screening: Screening; movie: Movie } | null>(null);
  protected readonly screening = computed(() => this.loaded()?.screening ?? null);
  protected readonly movie = computed(() => this.loaded()?.movie ?? null);

  protected readonly items = computed(() => tickets(this.bookingService.booking()?.seats ?? []));
  protected readonly total = computed(() => this.items().reduce((sum, ticket) => sum + ticket.price, 0));

  ngOnInit(): void {
    this.api
      .getScreeningWithMovie(Number(this.id()))
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (loaded) => this.loaded.set(loaded),
        error: () => void this.router.navigate(['/']),
      });
  }

  protected seatLabel(ticket: Ticket): string {
    return ticket.kind === 'couch' ? `Couch ${ticketSeatLabel(ticket)}` : ticketSeatLabel(ticket);
  }

  protected price(amount: number): string {
    return formatPrice(amount);
  }

  protected remove(ticket: Ticket): void {
    this.bookingService.update((booking) => ({
      ...booking,
      seats: booking.seats.filter((id) => !ticket.ids.includes(id)),
    }));
    if (this.bookingService.booking()?.seats.length === 0) {
      void this.router.navigate(['/screenings', this.id(), 'seats']);
    }
  }

  protected back(): void {
    void this.router.navigate(['/screenings', this.id(), 'seats']);
  }

  protected confirm(): void {
    void this.router.navigate(['/screenings', this.id(), 'checkout']);
  }
}
