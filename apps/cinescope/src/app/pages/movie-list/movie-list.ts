import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Movie } from '../../models/movie.model';
import { Screening } from '../../models/screening.model';
import { ApiService } from '../../services/api.service';
import { addDays, isValidIsoDate, parseIsoDate, startOfDay, toIsoDate, weekdayName } from '../../utils/date.util';

interface DayButton {
  date: string;
  label: string;
  selected: boolean;
}

interface MovieCard {
  movie: Movie;
  screenings: Screening[];
}

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly today = startOfDay(new Date());
  private readonly todayIso = toIsoDate(this.today);
  readonly minDate = this.today;

  private readonly rawDateParam = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  readonly effectiveDate = computed(() => {
    const raw = this.rawDateParam().get('date');
    if (raw && isValidIsoDate(raw) && raw >= this.todayIso) {
      return raw;
    }
    return this.todayIso;
  });

  private readonly fiveDayIsoDates = Array.from({ length: 5 }, (_, i) => toIsoDate(addDays(this.today, i)));

  readonly dayButtons = computed<DayButton[]>(() => {
    const selected = this.effectiveDate();
    return this.fiveDayIsoDates.map((date, i) => ({
      date,
      label: i === 0 ? 'Today' : weekdayName(addDays(this.today, i)),
      selected: date === selected,
    }));
  });

  readonly datepickerValue = computed<Date | null>(() => {
    const date = this.effectiveDate();
    return this.fiveDayIsoDates.includes(date) ? null : parseIsoDate(date);
  });

  readonly loading = signal(false);
  readonly error = signal(false);
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);

  readonly cards = computed<MovieCard[]>(() => {
    const screenings = this.screenings();
    return this.movies()
      .map((movie) => ({
        movie,
        screenings: screenings
          .filter((s) => s.movieId === movie.id)
          .slice()
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  constructor() {
    effect(() => {
      this.loadFor(this.effectiveDate());
    });
  }

  private loadFor(date: string): void {
    this.loading.set(true);
    this.error.set(false);
    forkJoin({
      movies: this.api.getMovies(),
      screenings: this.api.getScreenings({ date }),
    }).subscribe({
      next: ({ movies, screenings }) => {
        this.movies.set(movies);
        this.screenings.set(screenings);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  retry(): void {
    this.loadFor(this.effectiveDate());
  }

  selectDate(date: string): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { date } });
  }

  onDatepickerChange(date: Date | null): void {
    if (date) {
      this.selectDate(toIsoDate(date));
    }
  }

  openSeats(screeningId: number): void {
    this.router.navigate(['/screenings', screeningId, 'seats']);
  }
}
