import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, map, of, startWith, switchMap } from 'rxjs';
import { CinemaApi } from '../cinema-api.service';
import { WEEKDAY_NAMES, addDays, parseIsoDate, startOfToday, toIsoDate } from '../dates';
import { Movie, Screening } from '../models';

interface DayButton {
  iso: string;
  label: string;
}

interface MovieWithScreenings {
  movie: Movie;
  screenings: Screening[];
}

type MovieListState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; movies: MovieWithScreenings[] };

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly todayDate = startOfToday();
  private readonly todayIso = toIsoDate(this.todayDate);

  readonly todayPickerMin = this.todayDate;
  readonly dayButtons: DayButton[] = Array.from({ length: 5 }, (_, offset) => {
    const date = addDays(this.todayDate, offset);
    return {
      iso: toIsoDate(date),
      label: offset === 0 ? 'Today' : WEEKDAY_NAMES[date.getDay()],
    };
  });

  private readonly queryDate = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('date'))),
    { initialValue: null },
  );

  /** `?date=` when it is a real date that is not in the past, otherwise today. */
  readonly selectedDate = computed(() => {
    const requested = this.queryDate();
    const isUsable = parseIsoDate(requested) !== null && requested !== null && requested >= this.todayIso;
    return isUsable ? requested : this.todayIso;
  });

  /** The datepicker shows the date only when it is not one of the five day buttons. */
  readonly pickerValue = computed(() => {
    const selected = this.selectedDate();
    return this.dayButtons.some((day) => day.iso === selected) ? null : parseIsoDate(selected);
  });

  private readonly attempt = signal(0);

  private readonly request = computed(() => ({ date: this.selectedDate(), attempt: this.attempt() }));

  readonly state = toSignal<MovieListState, MovieListState>(
    toObservable(this.request).pipe(
      switchMap(({ date }) =>
        forkJoin({ movies: this.api.movies(), screenings: this.api.screeningsOn(date) }).pipe(
          map(({ movies, screenings }) => ({
            status: 'loaded' as const,
            movies: groupScreenings(movies, screenings),
          })),
          startWith<MovieListState>({ status: 'loading' }),
          catchError(() => of<MovieListState>({ status: 'error' })),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } },
  );

  isSelected(day: DayButton): boolean {
    return day.iso === this.selectedDate();
  }

  chooseDate(iso: string | null): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { date: iso } });
  }

  onDatePicked(event: MatDatepickerInputEvent<Date>): void {
    this.chooseDate(event.value ? toIsoDate(event.value) : null);
  }

  retry(): void {
    this.attempt.update((count) => count + 1);
  }

  openScreening(id: number): void {
    this.router.navigate(['/screenings', id, 'seats']);
  }
}

function groupScreenings(movies: Movie[], screenings: Screening[]): MovieWithScreenings[] {
  const byMovie = new Map<number, Screening[]>();
  for (const screening of screenings) {
    byMovie.set(screening.movieId, [...(byMovie.get(screening.movieId) ?? []), screening]);
  }
  return movies.flatMap((movie) => {
    const movieScreenings = (byMovie.get(movie.id) ?? []).sort((a, b) => a.time.localeCompare(b.time));
    return movieScreenings.length > 0 ? [{ movie, screenings: movieScreenings }] : [];
  });
}
