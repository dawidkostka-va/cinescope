import { Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, concat, forkJoin, map, merge, Observable, of, Subject, switchMap } from 'rxjs';
import { CinemaApi } from '../cinema-api';
import { addDays, parseIsoDate, startOfToday, toIsoDate, weekdayName } from '../dates';
import { Movie, Screening } from '../models';

interface DayButton {
  date: string;
  label: string;
}

interface MovieCard {
  movie: Movie;
  screenings: Screening[];
}

type MovieListView =
  { status: 'loading' } | { status: 'error' } | { status: 'loaded'; cards: MovieCard[] };

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieListComponent {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly today = startOfToday();
  private readonly todayIso = toIsoDate(this.today);

  protected readonly dayButtons: DayButton[] = [0, 1, 2, 3, 4].map((offset) => {
    const day = addDays(this.today, offset);
    return { date: toIsoDate(day), label: offset === 0 ? 'Today' : weekdayName(day) };
  });

  protected readonly selectedDate = toSignal(
    this.route.queryParamMap.pipe(map((params) => this.resolveDate(params.get('date')))),
    { requireSync: true },
  );

  protected readonly pickedDate = computed(() => {
    const iso = this.selectedDate();
    return this.dayButtons.some((day) => day.date === iso) ? null : parseIsoDate(iso);
  });

  private readonly retry$ = new Subject<void>();

  protected readonly view = toSignal<MovieListView, MovieListView>(
    merge(toObservable(this.selectedDate), this.retry$.pipe(map(() => this.selectedDate()))).pipe(
      switchMap((date) => concat(of<MovieListView>({ status: 'loading' }), this.load(date))),
    ),
    { initialValue: { status: 'loading' } },
  );

  protected selectDay(date: string): void {
    this.router.navigate([], { queryParams: { date } });
  }

  protected onDatePicked(date: Date | null): void {
    if (date) {
      this.selectDay(toIsoDate(date));
    }
  }

  protected retry(): void {
    this.retry$.next();
  }

  protected openScreening(id: number): void {
    this.router.navigate(['/screenings', id, 'seats']);
  }

  private resolveDate(value: string | null): string {
    return value && parseIsoDate(value) && value >= this.todayIso ? value : this.todayIso;
  }

  private load(date: string): Observable<MovieListView> {
    return forkJoin({
      movies: this.api.movies(),
      screenings: this.api.screeningsOn(date),
    }).pipe(
      map(({ movies, screenings }): MovieListView => ({
        status: 'loaded',
        cards: this.cardsFor(movies, screenings),
      })),
      catchError(() => of<MovieListView>({ status: 'error' })),
    );
  }

  private cardsFor(movies: Movie[], screenings: Screening[]): MovieCard[] {
    return movies.flatMap((movie) => {
      const own = screenings
        .filter((screening) => screening.movieId === movie.id)
        .sort((a, b) => a.time.localeCompare(b.time));
      return own.length > 0 ? [{ movie, screenings: own }] : [];
    });
  }
}
