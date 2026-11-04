import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { WEEKDAYS, addDays, parseIso, startOfToday, toIso } from '../core/dates';
import { Movie, Screening } from '../core/models';

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="page">
      <div class="day-picker" data-testid="day-picker">
        @for (day of days; track day.date) {
          <button
            [matButton]="day.date === selected() ? 'filled' : 'outlined'"
            data-testid="day-button"
            [attr.data-date]="day.date"
            [attr.data-selected]="day.date === selected()"
            (click)="selectDay(day.date)"
          >{{ day.label }}</button>
        }
        <mat-form-field class="picker" subscriptSizing="dynamic">
          <mat-label>Other date</mat-label>
          <input
            matInput
            data-testid="date-picker"
            [matDatepicker]="picker"
            [min]="today"
            [value]="pickerValue()"
            (dateChange)="onPickerChange($event)"
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
          <div class="message">
            <p data-testid="movies-error">Failed to load movies</p>
            <button matButton="filled" data-testid="movies-retry-button" (click)="load()">Retry</button>
          </div>
        }
        @default {
          @if (cards().length === 0) {
            <p data-testid="movies-empty">No screenings on this day</p>
          } @else {
            <div class="movie-list" data-testid="movie-list">
              @for (card of cards(); track card.movie.id) {
                <div class="card" data-testid="movie-card" [attr.data-movie-id]="card.movie.id">
                  <h2 data-testid="movie-title">{{ card.movie.title }}</h2>
                  <div class="meta">
                    <span data-testid="movie-genre">{{ card.movie.genre }}</span>
                    <span data-testid="movie-runtime">{{ card.movie.runtimeMinutes }} min</span>
                    <span data-testid="movie-format">{{ card.movie.format }}</span>
                  </div>
                  <div class="times">
                    @for (s of card.screenings; track s.id) {
                      <button
                        matButton="outlined"
                        data-testid="screening-button"
                        [attr.data-screening-id]="s.id"
                        (click)="openScreening(s.id)"
                      >{{ s.time }}</button>
                    }
                  </div>
                </div>
              }
            </div>
          }
        }
      }
    </div>
  `,
  styles: `
    .day-picker {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .picker {
      width: 200px;
    }
    .movie-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .card {
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 12px;
      padding: 16px 20px;
    }
    h2 {
      margin: 0 0 8px;
      font-size: 1.4rem;
    }
    .meta {
      display: flex;
      gap: 24px;
      color: #555;
      margin-bottom: 12px;
    }
    .times {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  `,
})
export class MovieList {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly today = startOfToday();
  readonly days = Array.from({ length: 5 }, (_, i) => {
    const date = addDays(this.today, i);
    return { date: toIso(date), label: i === 0 ? 'Today' : WEEKDAYS[date.getDay()] };
  });

  private readonly params = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  readonly selected = computed(() => {
    const parsed = parseIso(this.params().get('date'));
    return parsed && parsed >= this.today ? toIso(parsed) : this.days[0].date;
  });

  readonly pickerValue = computed(() =>
    this.days.some((d) => d.date === this.selected()) ? null : parseIso(this.selected()),
  );

  readonly state = signal<'loading' | 'error' | 'loaded'>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);

  readonly cards = computed(() => {
    const date = this.selected();
    return this.movies()
      .map((movie) => ({
        movie,
        screenings: this.screenings()
          .filter((s) => s.movieId === movie.id && s.date === date)
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.state.set('loading');
    forkJoin({ movies: this.api.movies(), screenings: this.api.screenings() })
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

  selectDay(date: string): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { date } });
  }

  onPickerChange(event: MatDatepickerInputEvent<Date>): void {
    const value = event.value;
    if (value && value >= this.today) {
      this.selectDay(toIso(value));
    } else {
      (event.targetElement as HTMLInputElement).value = '';
    }
  }

  openScreening(id: number): void {
    this.router.navigate(['/screenings', id, 'seats']);
  }
}
