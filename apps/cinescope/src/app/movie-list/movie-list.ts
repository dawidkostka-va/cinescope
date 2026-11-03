import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, forkJoin, map } from 'rxjs';
import { ApiService } from '../core/api.service';
import { addDays, parseIso, startOfToday, toIso, weekdayName } from '../core/dates';
import { Movie, Screening } from '../core/models';

interface DayOption {
  label: string;
  date: string;
}

interface MovieCard {
  movie: Movie;
  screenings: Screening[];
}

@Component({
  selector: 'app-movie-list',
  imports: [MatButton, MatDatepickerModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="day-picker" data-testid="day-picker">
        @for (day of days; track day.date) {
          <button
            matButton="outlined"
            class="day-button"
            [class.selected]="day.date === selectedIso()"
            data-testid="day-button"
            [attr.data-date]="day.date"
            [attr.data-selected]="day.date === selectedIso()"
            (click)="selectDay(day.date)"
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
            (dateChange)="onPick($event.value)"
          />
          <mat-datepicker-toggle matIconSuffix [for]="picker" />
          <mat-datepicker #picker />
        </mat-form-field>
      </div>

      @switch (status()) {
        @case ('loading') {
          <p data-testid="movies-loading">Loading…</p>
        }
        @case ('error') {
          <div data-testid="movies-error">
            <p>Failed to load movies</p>
          </div>
          <button matButton="filled" data-testid="movies-retry-button" (click)="load()">Retry</button>
        }
        @default {
          @if (cards().length === 0) {
            <p data-testid="movies-empty">No screenings on this day</p>
          } @else {
            <div class="movie-list" data-testid="movie-list">
              @for (card of cards(); track card.movie.id) {
                <div class="movie-card" data-testid="movie-card" [attr.data-movie-id]="card.movie.id">
                  <h2 data-testid="movie-title">{{ card.movie.title }}</h2>
                  <div class="meta">
                    <span data-testid="movie-genre">{{ card.movie.genre }}</span>
                    <span data-testid="movie-runtime">{{ card.movie.runtimeMinutes }} min</span>
                    <span data-testid="movie-format">{{ card.movie.format }}</span>
                  </div>
                  <div class="screenings">
                    @for (s of card.screenings; track s.id) {
                      <button
                        matButton="filled"
                        data-testid="screening-button"
                        [attr.data-screening-id]="s.id"
                        (click)="openScreening(s.id)"
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
      flex-wrap: wrap;
      margin-bottom: 24px;
    }
    .day-button.selected {
      background: var(--mat-sys-primary-container);
    }
    .date-field {
      width: 190px;
    }
    .movie-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .movie-card {
      border: 1px solid #ccc;
      border-radius: 12px;
      padding: 16px 24px;
    }
    .movie-card h2 {
      margin: 0 0 8px;
    }
    .meta {
      display: flex;
      gap: 24px;
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
  private readonly destroyRef = inject(DestroyRef);

  protected readonly today = startOfToday();
  private readonly todayIso = toIso(this.today);
  protected readonly days: DayOption[] = Array.from({ length: 5 }, (_, i) => {
    const d = addDays(this.today, i);
    return { label: i === 0 ? 'Today' : weekdayName(d), date: toIso(d) };
  });

  private readonly query = toSignal(this.route.queryParamMap);
  protected readonly selectedIso = computed(() => {
    const raw = this.query()?.get('date') ?? '';
    return parseIso(raw) && raw >= this.todayIso ? raw : this.todayIso;
  });

  protected readonly dateControl = new FormControl<Date | null>(null);

  protected readonly status = signal<'loading' | 'error' | 'loaded'>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);
  private request?: Subscription;

  protected readonly cards = computed<MovieCard[]>(() => {
    const day = this.selectedIso();
    const onDay = this.screenings()
      .filter((s) => s.date === day)
      .sort((a, b) => a.time.localeCompare(b.time));
    return this.movies()
      .map((movie) => ({ movie, screenings: onDay.filter((s) => s.movieId === movie.id) }))
      .filter((card) => card.screenings.length > 0);
  });

  constructor() {
    effect(() => this.syncPicker(this.selectedIso()));
    this.load();
  }

  protected load(): void {
    this.request?.unsubscribe();
    this.status.set('loading');
    this.request = forkJoin([this.api.movies(), this.api.screenings()])
      .pipe(
        map(([movies, screenings]) => ({ movies, screenings })),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ movies, screenings }) => {
          this.movies.set(movies);
          this.screenings.set(screenings);
          this.status.set('loaded');
        },
        error: () => this.status.set('error'),
      });
  }

  protected selectDay(date: string): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { date } });
  }

  protected onPick(value: Date | null): void {
    const iso = value ? toIso(value) : null;
    if (iso && iso >= this.todayIso) {
      this.selectDay(iso);
      this.syncPicker(iso);
    } else {
      this.syncPicker(this.selectedIso());
    }
  }

  protected openScreening(id: number): void {
    this.router.navigate(['/screenings', id, 'seats']);
  }

  private syncPicker(iso: string): void {
    const inFive = this.days.some((d) => d.date === iso);
    this.dateControl.setValue(inFive ? null : parseIso(iso), { emitEvent: false });
  }
}
