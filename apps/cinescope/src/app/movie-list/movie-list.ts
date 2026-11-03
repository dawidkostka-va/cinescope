import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Api, Movie, Screening } from '../core/api';
import { addDays, parseIsoDate, startOfToday, toIsoDate, weekdayName } from '../core/dates';

@Component({
  selector: 'app-movie-list',
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly today = startOfToday();
  private readonly todayIso = toIsoDate(this.today);

  protected readonly days = Array.from({ length: 5 }, (_, index) => {
    const date = addDays(this.today, index);
    return { iso: toIsoDate(date), label: index === 0 ? 'Today' : weekdayName(date) };
  });

  private readonly queryParams = toSignal(this.route.queryParamMap, { requireSync: true });

  protected readonly selectedDate = computed(() => {
    const raw = this.queryParams().get('date');
    const parsed = raw === null ? null : parseIsoDate(raw);
    return parsed && parsed >= this.today ? toIsoDate(parsed) : this.todayIso;
  });

  protected readonly dateControl = new FormControl<Date | null>(null);

  protected readonly state = signal<'loading' | 'error' | 'loaded'>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);

  protected readonly cards = computed(() => {
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
    effect(() => this.syncPicker(this.selectedDate()));
    this.dateControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      if (value instanceof Date && !isNaN(value.getTime())) {
        const day = new Date(value.getFullYear(), value.getMonth(), value.getDate());
        if (day >= this.today) {
          this.select(toIsoDate(day));
        }
      }
    });
    this.load();
  }

  protected load(): void {
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

  protected select(date: string): void {
    this.syncPicker(date);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { date } });
  }

  protected openSeats(id: number): void {
    void this.router.navigate(['/screenings', id, 'seats']);
  }

  private syncPicker(date: string): void {
    const inRow = this.days.some((day) => day.iso === date);
    this.dateControl.setValue(inRow ? null : parseIsoDate(date), { emitEvent: false });
  }
}
