import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { BookingService } from '../../core/services/booking.service';
import { ToastService } from '../../core/services/toast.service';
import { Movie } from '../../core/models/movie.model';
import { Screening } from '../../core/models/screening.model';
import { formatShowDate } from '../../core/utils/date.util';
import { AuditoriumComponent } from './auditorium.component';
import { LegendComponent } from './legend.component';
import { SelectedSeatsPanelComponent } from './selected-seats-panel.component';

@Component({
  selector: 'app-seat-selection',
  imports: [MatButtonModule, AuditoriumComponent, LegendComponent, SelectedSeatsPanelComponent],
  templateUrl: './seat-selection.component.html',
  styleUrl: './seat-selection.component.scss',
})
export class SeatSelectionComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  private readonly screeningId = toSignal(this.route.paramMap.pipe(map((params) => Number(params.get('id')))), {
    initialValue: NaN,
  });

  private readonly screening = signal<Screening | null>(null);
  private readonly movie = signal<Movie | null>(null);

  readonly showDate = computed(() => {
    const screening = this.screening();
    return screening ? formatShowDate(screening.date, screening.time) : '';
  });

  readonly occupiedSeats = computed(() => this.screening()?.occupiedSeats ?? []);
  readonly selectedSeats = computed(() => this.bookingService.booking()?.seats ?? []);

  constructor() {
    effect(() => {
      const id = this.screeningId();
      this.screening.set(null);
      this.movie.set(null);

      if (!Number.isFinite(id)) {
        this.router.navigateByUrl('/');
        return;
      }

      this.api.getScreening(id).subscribe({
        next: (screening) => {
          this.api.getMovie(screening.movieId).subscribe({
            next: (movie) => {
              this.screening.set(screening);
              this.movie.set(movie);
              this.bookingService.ensureForScreening(id);
            },
            error: () => this.router.navigateByUrl('/'),
          });
        },
        error: () => this.router.navigateByUrl('/'),
      });
    });
  }

  onToggle(identifiers: string[]): void {
    const result = this.bookingService.toggleSeats(identifiers);
    if (result === 'limit') {
      this.toast.show('Maximum 10 seats per booking');
    }
  }

  cancel(): void {
    this.bookingService.clear();
    this.router.navigateByUrl('/');
  }

  continue(): void {
    if (this.selectedSeats().length === 0) return;
    this.router.navigate(['/screenings', this.screeningId(), 'summary']);
  }
}
