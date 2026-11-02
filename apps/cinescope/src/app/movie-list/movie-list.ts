import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../api.service';
import { Movie, Screening } from '../models';
import { parseIsoDate, toIsoDate, weekdayName } from '../seating';

type LoadState = 'loading' | 'error' | 'loaded';

@Component({
  selector: 'app-movie-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="page">
      <div class="day-picker" data-testid="day-picker">
        @for (day of days; track day.date) {
          <button
            mat-flat-button
            type="button"
            data-testid="day-button"
            [class.selected]="day.date === selectedDate()"
            [attr.data-date]="day.date"
            [attr.data-selected]="day.date === selectedDate() ? 'true' : 'false'"
            (click)="selectDate(day.date)"
          >
            {{ day.label }}
          </button>
        }
        <mat-form-field class="date-field" subscriptSizing="dynamic">
          <mat-label>Other date</mat-label>
          <input
            matInput
            data-testid="date-picker"
            [matDatepicker]="picker"
            [min]="today"
            [formControl]="dateControl"
            (dateChange)="onPickerChange($event.value)"
          />
          <mat-datepicker-toggle matIconSuffix [for]="picker" />
          <mat-datepicker #picker />
        </mat-form-field>
      </div>

      @switch (state()) {
        @case ('loading') {
          <p data-testid="movies-loading">Loading…</p>
        }
        @case ('error') {
          <div data-testid="movies-error" class="error">
            <p>Failed to load movies</p>
          </div>
          <button mat-flat-button type="button" data-testid="movies-retry-button" (click)="load()">Retry</button>
        }
        @default {
          @if (cards().length === 0) {
            <p data-testid="movies-empty">No screenings on this day</p>
          } @else {
            <div class="movie-list" data-testid="movie-list">
              @for (card of cards(); track card.movie.id) {
                <mat-card appearance="outlined" class="movie-card" data-testid="movie-card" [attr.data-movie-id]="card.movie.id">
                  <mat-card-content>
                    <h2 data-testid="movie-title">{{ card.movie.title }}</h2>
                    <div class="meta">
                      <span data-testid="movie-genre">{{ card.movie.genre }}</span>
                      <span data-testid="movie-runtime">{{ card.movie.runtimeMinutes }} min</span>
                      <span data-testid="movie-format">{{ card.movie.format }}</span>
                    </div>
                    <div class="screenings">
                      @for (s of card.screenings; track s.id) {
                        <button
                          mat-stroked-button
                          type="button"
                          data-testid="screening-button"
                          [attr.data-screening-id]="s.id"
                          (click)="open(s.id)"
                        >
                          {{ s.time }}
                        </button>
                      }
                    </div>
                  </mat-card-content>
                </mat-card>
              }
            </div>
          }
        }
      }
    </div>
  `,
  styles: `
    .page {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px;
    }
    .day-picker {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }
    .day-picker button:not(.selected) {
      background: transparent;
      color: inherit;
      border: 1px solid #999;
    }
    .date-field {
      width: 190px;
    }
    .movie-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    h2 {
      margin: 0 0 8px;
    }
    .meta {
      display: flex;
      gap: 16px;
      color: #555;
      margin-bottom: 12px;
    }
    .screenings {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
  `,
})
export class MovieList {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly queryParams = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  readonly todayDate = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  readonly today = this.todayDate;
  private readonly todayIso = toIsoDate(this.todayDate);

  readonly days = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(this.todayDate.getFullYear(), this.todayDate.getMonth(), this.todayDate.getDate() + i);
    return { date: toIsoDate(date), label: i === 0 ? 'Today' : weekdayName(date) };
  });

  readonly selectedDate = computed(() => {
    const raw = this.queryParams().get('date');
    const parsed = parseIsoDate(raw);
    return parsed && raw !== null && raw >= this.todayIso ? raw : this.todayIso;
  });

  readonly dateControl = new FormControl<Date | null>(null);

  readonly state = signal<LoadState>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);

  readonly cards = computed(() => {
    const date = this.selectedDate();
    const onDay = this.screenings().filter((s) => s.date === date);
    return this.movies()
      .map((movie) => ({
        movie,
        screenings: onDay.filter((s) => s.movieId === movie.id).sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  constructor() {
    effect(() => {
      const date = this.selectedDate();
      const inRow = this.days.some((d) => d.date === date);
      this.dateControl.setValue(inRow ? null : parseIsoDate(date), { emitEvent: false });
    });
    this.load();
  }

  load(): void {
    this.state.set('loading');
    forkJoin({ movies: this.api.getMovies(), screenings: this.api.getScreenings() }).subscribe({
      next: ({ movies, screenings }) => {
        this.movies.set(movies);
        this.screenings.set(screenings);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }

  selectDate(date: string): void {
    this.router.navigate([], { queryParams: { date }, queryParamsHandling: 'merge' });
  }

  onPickerChange(value: Date | null): void {
    if (!value) return;
    const date = toIsoDate(value);
    if (date < this.todayIso) {
      this.dateControl.setValue(parseIsoDate(this.selectedDate()), { emitEvent: false });
      return;
    }
    this.selectDate(date);
  }

  open(screeningId: number): void {
    this.router.navigate(['/screenings', screeningId, 'seats']);
  }
}
