import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, forkJoin, map, of, startWith, switchMap } from 'rxjs';
import { ApiService } from '../api.service';
import { parseIsoDate, startOfToday, toIsoDate, weekdayName } from '../date';
import { Movie, Screening } from '../models';

interface DayOption {
  iso: string;
  label: string;
  selected: boolean;
}

interface MovieWithScreenings {
  movie: Movie;
  screenings: Screening[];
}

type MovieListState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; items: MovieWithScreenings[] };

function resolveDate(value: string | null): string {
  const today = toIsoDate(startOfToday());
  const parsed = value === null ? null : parseIsoDate(value);
  if (!parsed || parsed < startOfToday()) return today;
  return toIsoDate(parsed);
}

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly retry$ = new BehaviorSubject<void>(undefined);
  private readonly date$ = this.route.queryParamMap.pipe(map((params) => resolveDate(params.get('date'))));

  readonly selectedDate = toSignal(this.date$, { requireSync: true });
  readonly today = startOfToday();

  readonly days = computed<DayOption[]>(() => {
    const selected = this.selectedDate();
    return Array.from({ length: 5 }, (_, i) => {
      const date = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate() + i);
      const iso = toIsoDate(date);
      return {
        iso,
        label: i === 0 ? 'Today' : weekdayName(date),
        selected: iso === selected,
      };
    });
  });

  readonly pickerDate = computed(() => {
    const selected = this.selectedDate();
    return this.days().some((d) => d.iso === selected) ? null : parseIsoDate(selected);
  });

  readonly state = toSignal(
    combineLatest([this.date$, this.retry$]).pipe(
      map(([date]) => date),
      switchMap((date) =>
        forkJoin({ movies: this.api.getMovies(), screenings: this.api.getScreenings(date) }).pipe(
          map(({ movies, screenings }): MovieListState => ({
            status: 'loaded',
            items: group(movies, screenings, date),
          })),
          catchError(() => of<MovieListState>({ status: 'error' })),
          startWith<MovieListState>({ status: 'loading' }),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } as MovieListState },
  );

  selectDay(iso: string): void {
    void this.router.navigate(['/'], { queryParams: { date: iso } });
  }

  onPickerChange(date: Date | null): void {
    if (date) this.selectDay(toIsoDate(date));
  }

  retry(): void {
    this.retry$.next();
  }

  openSeats(screeningId: number): void {
    void this.router.navigate(['/screenings', screeningId, 'seats']);
  }

}

function group(movies: Movie[], screenings: Screening[], date: string): MovieWithScreenings[] {
  const forDay = screenings.filter((s) => s.date === date).sort((a, b) => a.time.localeCompare(b.time));
  return movies
    .map((movie) => ({ movie, screenings: forDay.filter((s) => s.movieId === movie.id) }))
    .filter((item) => item.screenings.length > 0);
}
