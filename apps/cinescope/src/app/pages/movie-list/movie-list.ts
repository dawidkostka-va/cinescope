import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, catchError, forkJoin, of, startWith, switchMap, tap } from 'rxjs';
import { Api } from '../../core/api';
import { addDays, parseIso, startOfToday, toIso, weekdayName } from '../../core/dates';
import { Movie, Screening } from '../../core/models';

interface Day {
  date: string;
  label: string;
}

interface MovieCard {
  movie: Movie;
  screenings: Screening[];
}

@Component({
  selector: 'app-movie-list',
  imports: [MatButton, MatDatepickerModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly today = startOfToday();
  protected readonly days: Day[] = Array.from({ length: 5 }, (_, i) => {
    const date = addDays(this.today, i);
    return { date: toIso(date), label: i === 0 ? 'Today' : weekdayName(date) };
  });

  private readonly query = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  protected readonly selectedDate = computed(() => {
    const parsed = parseIso(this.query().get('date'));
    return parsed && parsed >= this.today ? toIso(parsed) : toIso(this.today);
  });

  protected readonly pickerControl = new FormControl<Date | null>(null);

  protected readonly status = signal<'loading' | 'error' | 'loaded'>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);
  private readonly reload$ = new Subject<void>();

  protected readonly cards = computed<MovieCard[]>(() => {
    const date = this.selectedDate();
    const byMovie = new Map<number, Screening[]>();
    for (const screening of this.screenings()) {
      if (screening.date !== date) continue;
      const list = byMovie.get(screening.movieId) ?? [];
      list.push(screening);
      byMovie.set(screening.movieId, list);
    }
    return this.movies()
      .filter((movie) => byMovie.has(movie.id))
      .map((movie) => ({
        movie,
        screenings: [...byMovie.get(movie.id)!].sort((a, b) => a.time.localeCompare(b.time)),
      }));
  });

  constructor() {
    this.reload$
      .pipe(
        startWith(undefined),
        tap(() => this.status.set('loading')),
        switchMap(() =>
          forkJoin([this.api.movies(), this.api.screenings()]).pipe(
            tap(([movies, screenings]) => {
              this.movies.set(movies);
              this.screenings.set(screenings);
              this.status.set('loaded');
            }),
            catchError(() => {
              this.status.set('error');
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    effect(() => {
      const selected = this.selectedDate();
      const inButtons = this.days.some((day) => day.date === selected);
      this.pickerControl.setValue(inButtons ? null : parseIso(selected), { emitEvent: false });
    });
  }

  protected retry(): void {
    this.reload$.next();
  }

  protected selectDate(date: string): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { date } });
  }

  protected onPickerChange(value: Date | null): void {
    if (!value || isNaN(value.getTime())) {
      this.resetPicker();
      return;
    }
    const day = new Date(value.getFullYear(), value.getMonth(), value.getDate());
    if (day < this.today) {
      this.resetPicker();
      return;
    }
    this.selectDate(toIso(day));
  }

  private resetPicker(): void {
    const selected = this.selectedDate();
    const inButtons = this.days.some((day) => day.date === selected);
    this.pickerControl.setValue(inButtons ? null : parseIso(selected), { emitEvent: false });
  }

  protected openSeats(screeningId: number): void {
    void this.router.navigate(['/screenings', screeningId, 'seats']);
  }
}
