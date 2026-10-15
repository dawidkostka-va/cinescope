import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { BookingService } from '../../core/booking.service';
import { Movie, Screening } from '../../core/models';
import { formatPrice, priceForRow } from '../../core/pricing.util';
import { groupSelection, seatDescription } from '../../core/selection.util';

interface SummaryItem {
  title: string;
  datetime: string;
  row: number;
  seat: string;
  price: number;
  ids: string[];
}

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary implements OnInit {
  private readonly api = inject(ApiService);
  private readonly bookingService = inject(BookingService);
  private readonly router = inject(Router);

  @Input() id = '';

  readonly screening = signal<Screening | null>(null);
  readonly movie = signal<Movie | null>(null);
  readonly booking = this.bookingService.booking;

  readonly items = computed<SummaryItem[]>(() => {
    const screening = this.screening();
    const movie = this.movie();
    if (!screening || !movie) {
      return [];
    }
    const datetime = `${screening.date} ${screening.time}`;
    const rows = groupSelection(this.booking()?.seats ?? []);
    const items: SummaryItem[] = [];
    for (const row of rows) {
      for (const item of row.items) {
        items.push({
          title: movie.title,
          datetime,
          row: row.row,
          seat: item.kind === 'seat' ? seatDescription(item) : `Couch ${seatDescription(item)}`,
          price: priceForRow(row.row),
          ids: item.ids,
        });
      }
    }
    return items;
  });

  readonly total = computed(() => this.items().reduce((sum, item) => sum + item.price, 0));

  formatPrice = formatPrice;

  ngOnInit(): void {
    const screeningId = Number(this.id);
    this.api.getScreening(screeningId).subscribe({
      next: (screening) => {
        this.api.getMovie(screening.movieId).subscribe({
          next: (movie) => {
            this.screening.set(screening);
            this.movie.set(movie);
          },
          error: () => this.router.navigateByUrl('/'),
        });
      },
      error: () => this.router.navigateByUrl('/'),
    });
  }

  remove(item: SummaryItem): void {
    this.bookingService.removeSeats(item.ids);
    if ((this.bookingService.booking()?.seats.length ?? 0) === 0) {
      this.router.navigateByUrl(`/screenings/${this.id}/seats`);
    }
  }

  back(): void {
    this.router.navigateByUrl(`/screenings/${this.id}/seats`);
  }

  confirm(): void {
    this.router.navigateByUrl(`/screenings/${this.id}/checkout`);
  }
}
