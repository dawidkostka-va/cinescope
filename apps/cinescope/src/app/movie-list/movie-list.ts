import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { CinemaApi } from '../api';
import { addDays, parseIsoDate, startOfToday, toIsoDate, WEEKDAYS } from '../dates';
import { Movie, Screening } from '../models';

interface Catalogue {
  movies: Movie[];
  screenings: Screening[];
}

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  readonly date = input<string>();

  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly minDate = startOfToday();
  private readonly today = toIsoDate(this.minDate);

  readonly days = [0, 1, 2, 3, 4].map((offset) => {
    const day = addDays(this.minDate, offset);
    return { iso: toIsoDate(day), label: offset === 0 ? 'Today' : WEEKDAYS[day.getDay()] };
  });

  readonly selectedDate = computed(() => {
    const requested = this.date() ?? '';
    return parseIsoDate(requested) && requested >= this.today ? requested : this.today;
  });

  readonly dayButtons = computed(() =>
    this.days.map((day) => ({ ...day, selected: day.iso === this.selectedDate() })),
  );

  readonly pickerValue = computed(() => {
    const selected = this.selectedDate();
    return this.days.some((day) => day.iso === selected) ? null : parseIsoDate(selected);
  });

  readonly loading = signal(true);
  readonly failed = signal(false);
  private readonly catalogue = signal<Catalogue | null>(null);
  private request: Subscription | undefined;

  readonly cards = computed(() => {
    const catalogue = this.catalogue();
    if (!catalogue) {
      return [];
    }
    const day = this.selectedDate();
    return catalogue.movies
      .map((movie) => ({
        movie,
        screenings: catalogue.screenings
          .filter((screening) => screening.movieId === movie.id && screening.date === day)
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  constructor() {
    this.load();
    this.destroyRef.onDestroy(() => this.request?.unsubscribe());
  }

  load(): void {
    this.request?.unsubscribe();
    this.loading.set(true);
    this.failed.set(false);
    this.request = forkJoin({ movies: this.api.movies(), screenings: this.api.screenings() }).subscribe({
      next: (catalogue) => {
        this.catalogue.set(catalogue);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  selectDay(iso: string): void {
    this.router.navigate([], { queryParams: { date: iso } });
  }

  onDatePicked(value: Date | null): void {
    if (!value) {
      return;
    }
    const iso = toIsoDate(value);
    if (iso >= this.today) {
      this.selectDay(iso);
    }
  }

  openSeats(screeningId: number): void {
    this.router.navigate(['/screenings', screeningId, 'seats']);
  }
}
