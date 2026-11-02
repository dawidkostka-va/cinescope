import { Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, startWith, switchMap } from 'rxjs';
import { CinemaApi } from '../cinema-api';
import { addDays, parseIsoDate, startOfDay, toIsoDate, weekdayName } from '../dates';
import { Movie, Screening } from '../models';

type MovieListState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; movies: Movie[]; screenings: Screening[] };

@Component({
  selector: 'app-movie-list',
  imports: [RouterLink, MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);

  readonly date = input<string | null>(null);

  protected readonly today = startOfDay(new Date());
  protected readonly days = Array.from({ length: 5 }, (_, index) => {
    const date = addDays(this.today, index);
    return { iso: toIsoDate(date), label: index === 0 ? 'Today' : weekdayName(date) };
  });

  protected readonly day = computed(() => {
    const requested = parseIsoDate(this.date());
    return toIsoDate(requested && requested >= this.today ? requested : this.today);
  });

  protected readonly pickedDate = computed(() =>
    this.days.some((button) => button.iso === this.day()) ? null : parseIsoDate(this.day()),
  );

  private readonly attempt = signal(0);
  private readonly request = computed(() => ({ day: this.day(), attempt: this.attempt() }));

  protected readonly state = toSignal(
    toObservable(this.request).pipe(
      switchMap(({ day }) =>
        forkJoin({ movies: this.api.getMovies(), screenings: this.api.getScreenings(day) }).pipe(
          map((data): MovieListState => ({ status: 'ready', ...data })),
          startWith<MovieListState>({ status: 'loading' }),
          catchError(() => of<MovieListState>({ status: 'error' })),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } as MovieListState },
  );

  protected readonly cards = computed(() => {
    const state = this.state();
    if (state.status !== 'ready') {
      return [];
    }
    return state.movies
      .map((movie) => ({
        movie,
        screenings: state.screenings
          .filter((screening) => screening.movieId === movie.id)
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  protected retry(): void {
    this.attempt.update((count) => count + 1);
  }

  protected pickDate(date: Date | null): void {
    if (date) {
      void this.router.navigate(['/'], { queryParams: { date: toIsoDate(date) } });
    }
  }
}
