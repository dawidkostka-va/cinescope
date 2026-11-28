import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { BookingService } from '../../core/booking.service';
import { Movie, Screening } from '../../core/models';
import { BookingItem, formatPrice, itemDescription } from '../../core/seating';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly screeningId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  protected readonly booking = inject(BookingService);

  protected readonly screening = signal<Screening | null>(null);
  protected readonly movie = signal<Movie | null>(null);

  protected readonly formatPrice = formatPrice;
  protected readonly describe = itemDescription;

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const screening = await this.api.getScreening(this.screeningId);
      const movie = await this.api.getMovie(screening.movieId);
      this.movie.set(movie);
      this.screening.set(screening);
    } catch {
      void this.router.navigateByUrl('/');
    }
  }

  protected remove(item: BookingItem): void {
    this.booking.remove(item.ids);
    if (this.booking.items().length === 0) this.goToSeats();
  }

  protected goToSeats(): void {
    void this.router.navigate(['/screenings', this.screeningId, 'seats']);
  }

  protected confirm(): void {
    void this.router.navigate(['/screenings', this.screeningId, 'checkout']);
  }
}
