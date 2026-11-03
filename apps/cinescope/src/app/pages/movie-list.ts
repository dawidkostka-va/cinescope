import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { addDays, parseIso, toIso, weekdayName } from '../dates';
import { Movie, Screening } from '../models';

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="page">
      <div class="day-picker" data-testid="day-picker">
        @for (day of days(); track day.date) {
          <button
            mat-stroked-button
            data-testid="day-button"
            [class.selected]="day.date === selected()"
            [attr.data-date]="day.date"
            [attr.data-selected]="day.date === selected() ? 'true' : 'false'"
            (click)="select(day.date)"
          >
            {{ day.label }}
          </button>
        }
        <mat-form-field class="picker">
          <mat-label>Pick a date</mat-label>
          <input
            matInput
            data-testid="date-picker"
            [matDatepicker]="dp"
            [min]="minDate"
            [value]="pickerValue()"
            (dateChange)="pick($event.value)"
          />
          <mat-datepicker-toggle matSuffix [for]="dp" />
          <mat-datepicker #dp />
        </mat-form-field>
      </div>

      @switch (state()) {
        @case ('loading') {
          <p data-testid="movies-loading">Loading…</p>
        }
        @case ('error') {
          <div class="error">
            <p data-testid="movies-error">Failed to load movies</p>
            <button mat-flat-button data-testid="movies-retry-button" (click)="load()">Retry</button>
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
                        mat-flat-button
                        data-testid="screening-button"
                        [attr.data-screening-id]="s.id"
                        (click)="open(s.id)"
                      >
                        {{ s.time }}
                      </button>
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
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .picker {
      margin-left: 12px;
    }
    .day-picker ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
    button.selected {
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }
    .movie-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .card {
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px 24px;
    }
    .card h2 {
      margin: 0 0 8px;
      font-size: 20px;
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
export class MovieListPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly todayDate = (() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  })();
  private readonly today = toIso(this.todayDate);
  protected readonly minDate = this.todayDate;

  protected readonly state = signal<'loading' | 'error' | 'loaded'>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);

  private readonly queryDate = toSignal(this.route.queryParamMap.pipe(map((p) => p.get('date'))), {
    initialValue: this.route.snapshot.queryParamMap.get('date'),
  });

  protected readonly selected = computed(() => {
    const raw = this.queryDate();
    return raw !== null && parseIso(raw) && raw >= this.today ? raw : this.today;
  });

  protected readonly days = computed(() =>
    [0, 1, 2, 3, 4].map((i) => {
      const d = addDays(this.todayDate, i);
      return { date: toIso(d), label: i === 0 ? 'Today' : weekdayName(d) };
    }),
  );

  protected readonly pickerValue = computed(() =>
    this.days().some((d) => d.date === this.selected()) ? null : parseIso(this.selected()),
  );

  protected readonly cards = computed(() => {
    const day = this.selected();
    const onDay = this.screenings().filter((s) => s.date === day);
    return this.movies()
      .map((movie) => ({
        movie,
        screenings: onDay.filter((s) => s.movieId === movie.id).sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((c) => c.screenings.length > 0);
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    forkJoin([this.api.getMovies(), this.api.getScreenings()]).subscribe({
      next: ([movies, screenings]) => {
        this.movies.set(movies);
        this.screenings.set(screenings);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }

  protected select(date: string): void {
    this.router.navigate([], { queryParams: { date } });
  }

  protected pick(value: Date | null): void {
    if (!value) return;
    const iso = toIso(value);
    if (iso >= this.today) this.select(iso);
  }

  protected open(id: number): void {
    this.router.navigate(['/screenings', id, 'seats']);
  }
}
