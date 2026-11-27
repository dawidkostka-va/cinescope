import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { BookingService } from '../core/booking.service';
import { Movie, Screening } from '../core/models';
import { TicketItem, formatPrice } from '../core/seats';

@Component({
  selector: 'app-summary',
  imports: [MatButton],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly data = signal<{ screening: Screening; movie: Movie } | null>(null);
  protected readonly items = this.booking.items;
  protected readonly totalText = computed(() => `Total: ${formatPrice(this.booking.total())}`);

  constructor() {
    this.api
      .screening(this.id)
      .pipe(
        switchMap((screening) =>
          this.api.movie(screening.movieId).pipe(map((movie) => ({ screening, movie }))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (data) => this.data.set(data),
        error: () => this.router.navigateByUrl('/'),
      });
  }

  protected price(item: TicketItem): string {
    return formatPrice(item.price);
  }

  protected seatText(item: TicketItem): string {
    return item.couch ? `Couch ${item.columnStart}-${item.columnEnd}` : `${item.columnStart}`;
  }

  protected remove(item: TicketItem): void {
    const seats = this.booking.booking().seats.filter((s) => !item.ids.includes(s));
    this.booking.setSeats(seats);
    if (seats.length === 0) {
      this.router.navigate(['/screenings', this.id, 'seats']);
    }
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.id, 'seats']);
  }

  protected confirm(): void {
    this.router.navigate(['/screenings', this.id, 'checkout']);
  }
}
