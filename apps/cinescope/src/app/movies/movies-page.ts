import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { Api } from '../api';
import { addDays, parseIsoDate, startOfDay, toIsoDate, weekdayName } from '../dates';
import { Movie, Screening } from '../models';

@Component({
  selector: 'app-movies-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './movies-page.html',
  styleUrl: './movies-page.scss',
})
export class MoviesPage {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;

  readonly date = input<string | undefined>();

  readonly today = startOfDay(new Date());
  private readonly todayIso = toIsoDate(this.today);
  readonly days = [0, 1, 2, 3, 4].map((offset) => {
    const date = addDays(this.today, offset);
    return { iso: toIsoDate(date), label: offset === 0 ? 'Today' : weekdayName(date) };
  });

  readonly selectedDate = computed(() => {
    const value = this.date() ?? '';
    return parseIsoDate(value) && value >= this.todayIso ? value : this.todayIso;
  });

  readonly pickerControl = new FormControl<Date | null>(null);

  readonly status = signal<'loading' | 'error' | 'loaded'>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);

  readonly cards = computed(() => {
    const date = this.selectedDate();
    const onDay = this.screenings().filter((screening) => screening.date === date);
    return this.movies()
      .map((movie) => ({
        movie,
        screenings: onDay
          .filter((screening) => screening.movieId === movie.id)
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  constructor() {
    effect(() => {
      const selected = this.selectedDate();
      const isButtonDay = this.days.some((day) => day.iso === selected);
      this.pickerControl.setValue(isButtonDay ? null : parseIsoDate(selected), {
        emitEvent: false,
      });
    });
    this.destroyRef.onDestroy(() => this.request?.unsubscribe());
    this.load();
  }

  load(): void {
    this.request?.unsubscribe();
    this.status.set('loading');
    this.request = forkJoin([this.api.movies(), this.api.screenings()]).subscribe({
      next: ([movies, screenings]) => {
        this.movies.set(movies);
        this.screenings.set(screenings);
        this.status.set('loaded');
      },
      error: () => this.status.set('error'),
    });
  }

  selectDay(iso: string): void {
    this.router.navigate([], { queryParams: { date: iso } });
  }

  pickDate(event: MatDatepickerInputEvent<Date>): void {
    if (event.value) this.selectDay(toIsoDate(event.value));
  }

  openScreening(id: number): void {
    this.router.navigate(['/screenings', id, 'seats']);
  }
}
