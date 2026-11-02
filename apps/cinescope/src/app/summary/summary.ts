import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../api.service';
import { BookingService } from '../booking.service';
import { formatPrice } from '../dates';
import { Movie, Screening } from '../models';
import { TicketItem, describeItem } from '../seat-utils';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly booking = inject(BookingService);

  protected readonly data = signal<{ screening: Screening; movie: Movie } | null>(null);
  protected readonly formatPrice = formatPrice;

  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  constructor() {
    this.api.screeningWithMovie(this.id).subscribe({
      next: (d) => this.data.set(d),
      error: () => this.router.navigateByUrl('/'),
    });
  }

  protected seatText(item: TicketItem): string {
    return item.kind === 'couch' ? `Couch ${describeItem(item)}` : describeItem(item);
  }

  protected remove(item: TicketItem) {
    const seats = (this.booking.booking()?.seats ?? []).filter((s) => !item.ids.includes(s));
    this.booking.setSeats(seats);
    if (seats.length === 0) this.router.navigate(['/screenings', this.id, 'seats']);
  }

  protected back() {
    this.router.navigate(['/screenings', this.id, 'seats']);
  }

  protected confirm() {
    this.router.navigate(['/screenings', this.id, 'checkout']);
  }
}
