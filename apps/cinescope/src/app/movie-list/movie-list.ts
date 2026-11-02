import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ApiService } from '../core/api.service';
import { Movie, Screening } from '../core/models';
import { addDays, parseIsoDate, todayIso, toIsoDate, weekdayName } from '../core/dates';

interface DayOption {
  iso: string;
  label: string;
  selected: boolean;
}

interface MovieCard {
  movie: Movie;
  screenings: Screening[];
}

@Component({
  selector: 'app-movie-list',
  imports: [MatButton, MatDatepicker, MatDatepickerInput, MatDatepickerToggle, MatFormField, MatLabel, MatSuffix, MatInput],
  templateUrl: './movie-list.html',
})
export class MovieList {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly date = input<string>();

  protected readonly today = new Date();
  protected readonly todayIso = todayIso();
  protected readonly minDate = parseIsoDate(this.todayIso);

  protected readonly status = signal<'loading' | 'error' | 'loaded'>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);

  protected readonly selectedDate = computed(() => {
    const value = this.date();
    const date = parseIsoDate(value);
    return date && toIsoDate(date) >= this.todayIso ? toIsoDate(date) : this.todayIso;
  });

  protected readonly days = computed<DayOption[]>(() =>
    [0, 1, 2, 3, 4].map((offset) => {
      const date = addDays(this.today, offset);
      const iso = toIsoDate(date);
      return {
        iso,
        label: offset === 0 ? 'Today' : weekdayName(date),
        selected: iso === this.selectedDate(),
      };
    }),
  );

  protected readonly pickerDate = computed(() =>
    this.days().some((day) => day.selected) ? null : parseIsoDate(this.selectedDate()),
  );

  protected readonly cards = computed<MovieCard[]>(() => {
    const date = this.selectedDate();
    const screenings = this.screenings().filter((screening) => screening.date === date);
    return this.movies()
      .map((movie) => ({
        movie,
        screenings: screenings
          .filter((screening) => screening.movieId === movie.id)
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.status.set('loading');
    this.api
      .getMoviesWithScreenings()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: ({ movies, screenings }) => {
          this.movies.set(movies);
          this.screenings.set(screenings);
          this.status.set('loaded');
        },
        error: () => this.status.set('error'),
      });
  }

  protected selectDate(iso: string): void {
    void this.router.navigate(['/'], { queryParams: { date: iso } });
  }

  protected onPicked(date: Date | null): void {
    if (date) {
      this.selectDate(toIsoDate(date));
    }
  }

  protected openScreening(id: number): void {
    void this.router.navigate(['/screenings', id, 'seats']);
  }
}
