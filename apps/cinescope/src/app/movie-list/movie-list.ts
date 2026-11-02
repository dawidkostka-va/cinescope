import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
} from '@angular/material/datepicker';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  distinctUntilChanged,
  forkJoin,
  map,
  Observable,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { CinescopeApi } from '../api';
import { addDays, parseIsoDate, startOfToday, toIsoDate, weekdayName } from '../dates';
import { Movie, Screening } from '../models';

interface MovieCard {
  movie: Movie;
  screenings: Screening[];
}

type MovieListState =
  { status: 'loading' } | { status: 'error' } | { status: 'loaded'; cards: MovieCard[] };

@Component({
  selector: 'app-movie-list',
  imports: [
    MatButton,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatFormField,
    MatLabel,
    MatSuffix,
    MatInput,
    RouterLink,
  ],
  template: `
    @let current = state();
    @let selected = selectedDate();
    <section class="day-picker" data-testid="day-picker">
      @for (day of days; track day.iso) {
        <button
          mat-stroked-button
          data-testid="day-button"
          [attr.data-date]="day.iso"
          [attr.data-selected]="day.iso === selected ? 'true' : 'false'"
          [color]="day.iso === selected ? 'primary' : undefined"
          (click)="selectDay(day.iso)"
        >
          {{ day.label }}
        </button>
      }
      <mat-form-field class="date-field">
        <mat-label>Other date</mat-label>
        <input
          matInput
          data-testid="date-picker"
          [matDatepicker]="picker"
          [min]="today"
          [value]="pickedDate()"
          (dateChange)="pickDate($event.value)"
        />
        <mat-datepicker-toggle matSuffix [for]="picker" />
        <mat-datepicker #picker />
      </mat-form-field>
    </section>

    @switch (current.status) {
      @case ('loading') {
        <div class="status" data-testid="movies-loading">Loading…</div>
      }
      @case ('error') {
        <div class="status">
          <div data-testid="movies-error">Failed to load movies</div>
          <button mat-stroked-button data-testid="movies-retry-button" (click)="retry()">
            Retry
          </button>
        </div>
      }
      @case ('loaded') {
        <div class="movie-list" data-testid="movie-list">
          @for (card of current.cards; track card.movie.id) {
            <article
              class="movie-card"
              data-testid="movie-card"
              [attr.data-movie-id]="card.movie.id"
            >
              <h2 data-testid="movie-title">{{ card.movie.title }}</h2>
              <p class="meta">
                <span data-testid="movie-genre">{{ card.movie.genre }}</span>
                <span data-testid="movie-runtime">{{ card.movie.runtimeMinutes }} min</span>
                <span data-testid="movie-format">{{ card.movie.format }}</span>
              </p>
              <div class="screenings">
                @for (screening of card.screenings; track screening.id) {
                  <button
                    mat-stroked-button
                    data-testid="screening-button"
                    [attr.data-screening-id]="screening.id"
                    [routerLink]="['/screenings', screening.id, 'seats']"
                  >
                    {{ screening.time }}
                  </button>
                }
              </div>
            </article>
          }
        </div>
        @if (current.cards.length === 0) {
          <div class="status" data-testid="movies-empty">No screenings on this day</div>
        }
      }
    }
  `,
  styles: `
    :host {
      display: block;
      max-width: 960px;
      margin: 0 auto;
      padding: 24px;
    }

    .day-picker {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    .date-field {
      width: 200px;
    }

    .movie-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 24px;
    }

    .movie-card {
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 16px;
    }

    .movie-card h2 {
      margin: 0 0 8px;
      font-size: 20px;
    }

    .meta span + span::before {
      content: ' · ';
    }

    .screenings {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .status {
      margin-top: 24px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
  `,
})
export class MovieList {
  private readonly api = inject(CinescopeApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly today = startOfToday();
  protected readonly days = [0, 1, 2, 3, 4].map((offset) => {
    const date = addDays(this.today, offset);
    return {
      iso: toIsoDate(date),
      label: offset === 0 ? 'Today' : weekdayName(date),
    };
  });

  private readonly retry$ = new BehaviorSubject<void>(undefined);

  private readonly date$ = this.route.queryParamMap.pipe(
    map((params) => this.resolveDate(params.get('date'))),
    distinctUntilChanged(),
  );

  protected readonly selectedDate = toSignal(this.date$, { initialValue: toIsoDate(this.today) });

  protected readonly pickedDate = computed(() => {
    const selected = this.selectedDate();
    return this.days.some((day) => day.iso === selected) ? null : parseIsoDate(selected);
  });

  protected readonly state = toSignal<MovieListState, MovieListState>(
    combineLatest([this.date$, this.retry$]).pipe(switchMap(([date]) => this.load(date))),
    { initialValue: { status: 'loading' } },
  );

  protected selectDay(iso: string): void {
    this.navigateToDate(iso);
  }

  protected pickDate(date: Date | null): void {
    if (date) {
      this.navigateToDate(toIsoDate(date));
    }
  }

  protected retry(): void {
    this.retry$.next();
  }

  private navigateToDate(iso: string): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { date: iso } });
  }

  private resolveDate(raw: string | null): string {
    const todayIso = toIsoDate(this.today);
    const parsed = parseIsoDate(raw);
    if (!parsed) {
      return todayIso;
    }
    const iso = toIsoDate(parsed);
    return iso < todayIso ? todayIso : iso;
  }

  private load(date: string): Observable<MovieListState> {
    return forkJoin({
      movies: this.api.movies(),
      screenings: this.api.screeningsOn(date),
    }).pipe(
      map(({ movies, screenings }): MovieListState => ({
        status: 'loaded',
        cards: movies
          .map((movie) => ({
            movie,
            screenings: screenings
              .filter((screening) => screening.movieId === movie.id)
              .sort((a, b) => a.time.localeCompare(b.time)),
          }))
          .filter((card) => card.screenings.length > 0),
      })),
      catchError(() => of<MovieListState>({ status: 'error' })),
      startWith<MovieListState>({ status: 'loading' }),
    );
  }
}
