import { Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import {
  catchError,
  combineLatest,
  concat,
  forkJoin,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';
import { CinemaApi } from '../core/cinema-api';
import {
  addDays,
  parseIsoDate,
  selectedDayFrom,
  startOfToday,
  toIsoDate,
  weekdayName,
} from '../core/dates';
import { Movie, Screening } from '../core/models';

interface MovieGroup {
  movie: Movie;
  screenings: Screening[];
}

type ListState =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; groups: MovieGroup[] };

interface DayOption {
  iso: string;
  label: string;
}

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);

  readonly date = input<string | null>(null);

  readonly today = startOfToday();
  readonly todayIso = toIsoDate(this.today);
  readonly days: DayOption[] = Array.from({ length: 5 }, (_, index) => {
    const day = addDays(this.today, index);
    return { iso: toIsoDate(day), label: index === 0 ? 'Today' : weekdayName(day) };
  });

  readonly selectedDate = computed(() => selectedDayFrom(this.date(), this.todayIso));
  readonly selectedDateValue = computed(() => parseIsoDate(this.selectedDate()));

  private readonly retry$ = new Subject<void>();

  readonly state = toSignal<ListState, ListState>(
    combineLatest([toObservable(this.selectedDate), this.retry$.pipe(startWith(undefined))]).pipe(
      map(([date]) => date),
      switchMap((date) => concat(of<ListState>({ status: 'loading' }), this.load(date))),
    ),
    { initialValue: { status: 'loading' } },
  );

  retry(): void {
    this.retry$.next();
  }

  selectDay(iso: string): void {
    this.router.navigate(['/'], { queryParams: { date: iso } });
  }

  pickDate(date: Date | null): void {
    if (date) {
      this.selectDay(selectedDayFrom(toIsoDate(date), this.todayIso));
    }
  }

  openSeats(screeningId: number): void {
    this.router.navigate(['/screenings', screeningId, 'seats']);
  }

  private load(date: string): Observable<ListState> {
    return forkJoin({ movies: this.api.movies(), screenings: this.api.screeningsOn(date) }).pipe(
      map(({ movies, screenings }): ListState => ({
        status: 'ready',
        groups: groupByMovie(movies, screenings),
      })),
      catchError(() => of<ListState>({ status: 'error' })),
    );
  }
}

function groupByMovie(movies: Movie[], screenings: Screening[]): MovieGroup[] {
  return movies
    .map((movie) => ({
      movie,
      screenings: screenings
        .filter((screening) => screening.movieId === movie.id)
        .sort((a, b) => a.time.localeCompare(b.time)),
    }))
    .filter((group) => group.screenings.length > 0);
}
