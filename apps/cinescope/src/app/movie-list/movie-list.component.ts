import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { addDays, parseIsoDate, startOfToday, toIsoDate, weekdayName } from '../dates';
import { API_URL } from '../api';
import { Movie, Screening } from '../models';

type LoadState = 'loading' | 'error' | 'loaded';

interface DayButton {
  iso: string;
  label: string;
}

interface MovieCard {
  movie: Movie;
  screenings: Screening[];
}

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.component.html',
  styleUrl: './movie-list.component.scss',
})
export class MovieListComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly date = input<string>();

  readonly today = startOfToday();
  readonly selectedDate = computed(() => {
    const parsed = parseIsoDate(this.date());
    return parsed && parsed >= this.today ? parsed : this.today;
  });
  readonly selectedIso = computed(() => toIsoDate(this.selectedDate()));

  readonly days = computed<DayButton[]>(() =>
    [0, 1, 2, 3, 4].map((offset) => {
      const day = addDays(this.today, offset);
      return { iso: toIsoDate(day), label: offset === 0 ? 'Today' : weekdayName(day) };
    }),
  );

  readonly state = signal<LoadState>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);

  readonly cards = computed<MovieCard[]>(() =>
    this.movies()
      .map((movie) => ({
        movie,
        screenings: this.screenings()
          .filter((s) => s.movieId === movie.id && s.date === this.selectedIso())
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0),
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.state.set('loading');
    forkJoin({
      movies: this.http.get<Movie[]>(`${API_URL}/movies`),
      screenings: this.http.get<Screening[]>(`${API_URL}/screenings`),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ movies, screenings }) => {
          this.movies.set(movies);
          this.screenings.set(screenings);
          this.state.set('loaded');
        },
        error: () => this.state.set('error'),
      });
  }

  selectDay(iso: string): void {
    this.router.navigate([], { queryParams: { date: iso } });
  }

  onDatePicked(value: Date | null): void {
    if (!value) {
      return;
    }
    const iso = toIsoDate(value);
    if (iso < toIsoDate(this.today)) {
      return;
    }
    this.selectDay(iso);
  }

  openScreening(id: number): void {
    this.router.navigate(['/screenings', id, 'seats']);
  }
}
