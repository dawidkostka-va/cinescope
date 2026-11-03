import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { ApiService } from '../api.service';
import { addDays, parseIso, toIso, today, weekdayName } from '../dates';
import { Movie, Screening } from '../models';

type LoadState = 'loading' | 'error' | 'loaded';

@Component({
  selector: 'app-movie-list',
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="page">
      <div class="day-picker" data-testid="day-picker">
        @for (day of days; track day.iso) {
          <button
            mat-stroked-button
            type="button"
            data-testid="day-button"
            [class.selected]="day.iso === selectedIso()"
            [attr.data-date]="day.iso"
            [attr.data-selected]="day.iso === selectedIso()"
            (click)="selectDay(day.iso)"
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
            [min]="minDate"
            [formControl]="dateControl"
            (dateChange)="onPick($event)"
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
          <div class="error">
            <p data-testid="movies-error">Failed to load movies</p>
            <button mat-flat-button type="button" data-testid="movies-retry-button" (click)="load()">Retry</button>
          </div>
        }
        @case ('loaded') {
          @if (cards().length === 0) {
            <p data-testid="movies-empty">No screenings on this day</p>
          } @else {
            <div class="movie-list" data-testid="movie-list">
              @for (card of cards(); track card.movie.id) {
                <mat-card class="movie-card" data-testid="movie-card" [attr.data-movie-id]="card.movie.id">
                  <mat-card-content>
                    <h2 data-testid="movie-title">{{ card.movie.title }}</h2>
                    <div class="meta">
                      <span data-testid="movie-genre">{{ card.movie.genre }}</span>
                      <span data-testid="movie-runtime">{{ card.movie.runtimeMinutes }} min</span>
                      <span data-testid="movie-format">{{ card.movie.format }}</span>
                    </div>
                    <div class="times">
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
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
    }
    .day-picker {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
    }
    .day-picker button.selected {
      background: #1565c0;
      color: #fff;
    }
    .date-field {
      width: 200px;
      margin-left: 8px;
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
      margin-bottom: 12px;
      color: #555;
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

  protected readonly minDate = today();
  private readonly todayIso = toIso(this.minDate);
  protected readonly days = Array.from({ length: 5 }, (_, i) => {
    const date = addDays(this.minDate, i);
    return { iso: toIso(date), label: i === 0 ? 'Today' : weekdayName(date) };
  });

  private readonly query = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  protected readonly selectedIso = computed(() => {
    const raw = this.query().get('date');
    return raw && parseIso(raw) && raw >= this.todayIso ? raw : this.todayIso;
  });

  protected readonly dateControl = new FormControl<Date | null>(null);
  protected readonly state = signal<LoadState>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);
  private request?: Subscription;

  protected readonly cards = computed(() => {
    const iso = this.selectedIso();
    const ofDay = this.screenings().filter((s) => s.date === iso);
    return this.movies()
      .map((movie) => ({
        movie,
        screenings: ofDay
          .filter((s) => s.movieId === movie.id)
          .sort((a, b) => a.time.localeCompare(b.time) || a.id - b.id),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  constructor() {
    effect(() => this.syncPicker());
    this.destroyRef.onDestroy(() => this.request?.unsubscribe());
    this.load();
  }

  protected load(): void {
    this.request?.unsubscribe();
    this.state.set('loading');
    this.request = forkJoin([this.api.movies(), this.api.screenings()])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([movies, screenings]) => {
          this.movies.set(movies);
          this.screenings.set(screenings);
          this.state.set('loaded');
        },
        error: () => this.state.set('error'),
      });
  }

  protected selectDay(iso: string): void {
    this.router.navigate([], { queryParams: { date: iso } });
  }

  protected onPick(event: MatDatepickerInputEvent<Date>): void {
    const date = event.value;
    if (date && date >= this.minDate) this.selectDay(toIso(date));
    else this.syncPicker();
  }

  private syncPicker(): void {
    const iso = this.selectedIso();
    this.dateControl.setValue(this.days.some((d) => d.iso === iso) ? null : parseIso(iso), { emitEvent: false });
  }

  protected open(id: number): void {
    this.router.navigate(['/screenings', id, 'seats']);
  }
}
