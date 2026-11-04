import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Api } from '../core/api';
import { addDays, parseIso, toIso, weekdayName } from '../core/dates';
import { Movie, Screening } from '../core/models';

interface DayOption {
  label: string;
  date: string;
}

@Component({
  selector: 'app-movie-list',
  imports: [MatButton, MatDatepickerModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, RouterLink],
  template: `
    <main class="page">
      <div class="day-picker" data-testid="day-picker">
        @for (day of days; track day.date) {
          <button
            [matButton]="day.date === selectedDate() ? 'filled' : 'outlined'"
            data-testid="day-button"
            [attr.data-date]="day.date"
            [attr.data-selected]="day.date === selectedDate()"
            (click)="selectDate(day.date)"
          >
            {{ day.label }}
          </button>
        }
        <mat-form-field class="date-field" appearance="outline" subscriptSizing="dynamic">
          <input
            matInput
            data-testid="date-picker"
            placeholder="Other date"
            [matDatepicker]="picker"
            [min]="todayDate"
            [formControl]="pickerControl"
            (dateChange)="onPicked($event.value)"
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
          <div class="state" data-testid="movies-error">
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
                <section class="movie-card" data-testid="movie-card" [attr.data-movie-id]="card.movie.id">
                  <h2 data-testid="movie-title">{{ card.movie.title }}</h2>
                  <div class="meta">
                    <span data-testid="movie-genre">{{ card.movie.genre }}</span>
                    <span data-testid="movie-runtime">{{ card.movie.runtimeMinutes }} min</span>
                    <span data-testid="movie-format">{{ card.movie.format }}</span>
                  </div>
                  <div class="times">
                    @for (s of card.screenings; track s.id) {
                      <button
                        matButton="tonal"
                        data-testid="screening-button"
                        [attr.data-screening-id]="s.id"
                        [routerLink]="['/screenings', s.id, 'seats']"
                      >
                        {{ s.time }}
                      </button>
                    }
                  </div>
                </section>
              }
            </div>
          }
        }
      }
    </main>
  `,
  styles: `
    .page {
      max-width: 900px;
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
      border-radius: 8px;
      padding: 16px;
    }
    .movie-card h2 {
      margin: 0 0 8px;
    }
    .meta {
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
export class MovieList implements OnInit {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly query = toSignal(inject(ActivatedRoute).queryParamMap);

  protected readonly todayDate = this.startOfToday();
  private readonly today = toIso(this.todayDate);

  protected readonly days: DayOption[] = Array.from({ length: 5 }, (_, i) => {
    const date = addDays(this.todayDate, i);
    return { label: i === 0 ? 'Today' : weekdayName(date), date: toIso(date) };
  });

  protected readonly status = signal<'loading' | 'error' | 'loaded'>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);

  protected readonly pickerControl = new FormControl<Date | null>(null);

  protected readonly selectedDate = computed(() => {
    const value = this.query()?.get('date') ?? null;
    return value !== null && parseIso(value) && value >= this.today ? value : this.today;
  });

  protected readonly cards = computed(() => {
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
      this.selectedDate();
      this.syncPicker();
    });
  }

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.status.set('loading');
    forkJoin([this.api.movies(), this.api.screenings()]).subscribe({
      next: ([movies, screenings]) => {
        this.movies.set(movies);
        this.screenings.set(screenings);
        this.status.set('loaded');
      },
      error: () => this.status.set('error'),
    });
  }

  protected selectDate(date: string): void {
    this.router.navigate([], { queryParams: { date } }).then(() => this.syncPicker());
  }

  private syncPicker(): void {
    const date = this.selectedDate();
    const inButtons = this.days.some((d) => d.date === date);
    this.pickerControl.setValue(inButtons ? null : parseIso(date), { emitEvent: false });
  }

  protected onPicked(value: Date | null): void {
    if (value) {
      this.selectDate(toIso(value));
    }
  }

  private startOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}
