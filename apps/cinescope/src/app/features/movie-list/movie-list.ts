import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { addDays, isoDate, resolveSelectedDate, startOfDay, weekdayName } from '../../core/date-utils';
import { Movie, Screening } from '../../core/models';

interface MovieCard {
  movie: Movie;
  screenings: Screening[];
}

interface DayButton {
  label: string;
  iso: string;
}

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieListComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly dateParam = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  readonly today = startOfDay(new Date());
  readonly minDate = this.today;

  readonly selectedDate = computed(() => resolveSelectedDate(this.dateParam().get('date')));
  readonly selectedDateIso = computed(() => isoDate(this.selectedDate()));

  readonly dayButtons: DayButton[] = [0, 1, 2, 3, 4].map((offset) => {
    const date = addDays(this.today, offset);
    return { label: offset === 0 ? 'Today' : weekdayName(date), iso: isoDate(date) };
  });

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly cards = signal<MovieCard[]>([]);

  constructor() {
    effect(() => this.load(this.selectedDateIso()));
  }

  private load(date: string): void {
    this.loading.set(true);
    this.error.set(false);
    forkJoin({ movies: this.api.getMovies(), screenings: this.api.getScreeningsByDate(date) }).subscribe({
      next: ({ movies, screenings }) => {
        const cards: MovieCard[] = movies
          .map((movie) => ({
            movie,
            screenings: screenings.filter((s) => s.movieId === movie.id).sort((a, b) => a.time.localeCompare(b.time)),
          }))
          .filter((card) => card.screenings.length > 0);
        this.cards.set(cards);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  retry(): void {
    this.load(this.selectedDateIso());
  }

  selectDate(iso: string): void {
    this.router.navigate(['/'], { queryParams: { date: iso } });
  }

  onDatePicked(date: Date | null): void {
    if (date) this.selectDate(isoDate(date));
  }

  openSeats(screeningId: number): void {
    this.router.navigate(['/screenings', screeningId, 'seats']);
  }
}
