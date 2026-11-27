import { Component, DestroyRef, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerInput, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { Api } from '../api.service';
import { Movie, Screening } from '../models';
import { parseIsoDate, toIsoDate, weekdayName } from '../seat-utils';

interface Day {
  iso: string;
  label: string;
}

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="page">
      <div class="day-picker" data-testid="day-picker">
        @for (day of days; track day.iso) {
          <button
            mat-stroked-button
            type="button"
            class="day-button"
            data-testid="day-button"
            [class.selected]="day.iso === selected()"
            [attr.data-date]="day.iso"
            [attr.data-selected]="day.iso === selected()"
            (click)="selectDay(day.iso)"
          >{{ day.label }}</button>
        }
        <mat-form-field class="date-field" subscriptSizing="dynamic">
          <mat-label>Other date</mat-label>
          <input
            matInput
            data-testid="date-picker"
            [matDatepicker]="picker"
            [min]="today"
            [value]="pickerValue()"
            (dateChange)="onPick($event.value)"
            (click)="picker.open()"
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
            <button
              mat-flat-button
              type="button"
              data-testid="movies-retry-button"
              (click)="load()"
            >Retry</button>
          </div>
        }
        @default {
          @if (cards().length === 0) {
            <p data-testid="movies-empty">No screenings on this day</p>
          } @else {
            <div class="movie-list" data-testid="movie-list">
              @for (card of cards(); track card.movie.id) {
                <div
                  class="movie-card"
                  data-testid="movie-card"
                  [attr.data-movie-id]="card.movie.id"
                >
                  <h2 data-testid="movie-title">{{ card.movie.title }}</h2>
                  <div class="details">
                    <span data-testid="movie-genre">{{ card.movie.genre }}</span>
                    <span data-testid="movie-runtime">{{ card.movie.runtimeMinutes }} min</span>
                    <span data-testid="movie-format">{{ card.movie.format }}</span>
                  </div>
                  <div class="times">
                    @for (screening of card.screenings; track screening.id) {
                      <button
                        mat-stroked-button
                        type="button"
                        data-testid="screening-button"
                        [attr.data-screening-id]="screening.id"
                        (click)="openScreening(screening.id)"
                      >{{ screening.time }}</button>
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
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 24px;
    }
    .day-button.selected {
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }
    .date-field {
      width: 200px;
    }
    .movie-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .movie-card {
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 16px;
    }
    .movie-card h2 {
      margin: 0 0 8px;
    }
    .details {
      display: flex;
      gap: 16px;
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
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly today = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
  );
  private readonly todayIso = toIsoDate(this.today);
  protected readonly days: Day[] = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(
      this.today.getFullYear(),
      this.today.getMonth(),
      this.today.getDate() + i,
    );
    return { iso: toIsoDate(date), label: i === 0 ? 'Today' : weekdayName(date) };
  });

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly selected = computed(() => {
    const date = this.queryParams().get('date');
    return date && parseIsoDate(date) && date >= this.todayIso ? date : this.todayIso;
  });
  protected readonly pickerValue = computed(() => {
    const selected = this.selected();
    return this.days.some((d) => d.iso === selected) ? null : parseIsoDate(selected);
  });

  protected readonly state = signal<'loading' | 'error' | 'loaded'>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);
  private request?: Subscription;
  private readonly pickerInput = viewChild(MatDatepickerInput);

  protected readonly cards = computed(() => {
    const date = this.selected();
    const onDay = this.screenings().filter((s) => s.date === date);
    return this.movies()
      .map((movie) => ({
        movie,
        screenings: onDay
          .filter((s) => s.movieId === movie.id)
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  constructor() {
    this.load();
    this.destroyRef.onDestroy(() => this.request?.unsubscribe());
  }

  protected load(): void {
    this.request?.unsubscribe();
    this.state.set('loading');
    this.request = forkJoin({ movies: this.api.movies(), screenings: this.api.screenings() })
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

  protected selectDay(iso: string): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { date: iso } });
  }

  protected onPick(date: Date | null): void {
    if (!date) return;
    const iso = toIsoDate(date);
    if (iso < this.todayIso) return;
    if (this.days.some((d) => d.iso === iso)) {
      const input = this.pickerInput();
      if (input) input.value = null;
    }
    this.selectDay(iso);
  }

  protected openScreening(id: number): void {
    this.router.navigate(['/screenings', id, 'seats']);
  }
}
