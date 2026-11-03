import { Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, combineLatest, concat, forkJoin, map, of, startWith, Subject, switchMap } from 'rxjs';
import { CinemaApi, Movie, Screening } from '../core/api';
import { addDays, isValidIsoDate, isoToDate, toIsoDate, todayIso, weekdayName } from '../core/format';

interface MovieCard {
  movie: Movie;
  screenings: Screening[];
}

type MovieListView =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; cards: MovieCard[] };

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.component.html',
  styleUrl: './movie-list.component.scss',
})
export class MovieListComponent {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly retry$ = new Subject<void>();

  protected readonly dayButtons = computed(() => {
    const today = todayIso();
    return [0, 1, 2, 3, 4].map((offset) => {
      const iso = addDays(today, offset);
      return { iso, label: offset === 0 ? 'Today' : weekdayName(iso) };
    });
  });

  private readonly queryDate = toSignal(this.route.queryParamMap.pipe(map((params) => params.get('date'))), {
    requireSync: true,
  });

  protected readonly date = computed(() => {
    const raw = this.queryDate();
    const today = todayIso();
    return isValidIsoDate(raw) && raw >= today ? raw : today;
  });

  protected readonly pickerValue = computed(() => {
    const date = this.date();
    return this.dayButtons().some((day) => day.iso === date) ? null : isoToDate(date);
  });

  protected readonly view = toSignal(
    combineLatest([toObservable(this.date), this.retry$.pipe(startWith(undefined))]).pipe(
      switchMap(([date]) => this.load(date)),
    ),
    { initialValue: { status: 'loading' } as MovieListView },
  );

  protected readonly cards = computed(() => {
    const view = this.view();
    return view.status === 'ready' ? view.cards : [];
  });

  protected retry(): void {
    this.retry$.next();
  }

  protected selectDay(iso: string): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { date: iso } });
  }

  protected onPicked(value: Date | null): void {
    if (value && !Number.isNaN(value.getTime())) {
      this.selectDay(toIsoDate(value));
    }
  }

  protected openScreening(id: number): void {
    void this.router.navigate(['/screenings', id, 'seats']);
  }

  protected readonly minDate = isoToDate(todayIso());

  private load(date: string) {
    const loaded = forkJoin({
      movies: this.api.movies(),
      screenings: this.api.screenings(date),
    }).pipe(
      map(({ movies, screenings }): MovieListView => ({
        status: 'ready',
        cards: this.toCards(movies, screenings, date),
      })),
      catchError(() => of<MovieListView>({ status: 'error' })),
    );
    return concat(of<MovieListView>({ status: 'loading' }), loaded);
  }

  private toCards(movies: Movie[], screenings: Screening[], date: string): MovieCard[] {
    return movies
      .map((movie) => ({
        movie,
        screenings: screenings
          .filter((s) => s.movieId === movie.id && s.date === date)
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  }
}
