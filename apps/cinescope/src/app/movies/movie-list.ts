import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { parseIsoDate, toIsoDate, weekdayName } from '../core/dates';
import { Movie, Screening } from '../core/models';

interface Day {
  iso: string;
  label: string;
}

interface MovieCard {
  movie: Movie;
  screenings: Screening[];
}

@Component({
  selector: 'app-movie-list',
  imports: [
    ReactiveFormsModule,
    MatButton,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly today = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
  );
  protected readonly todayIso = toIsoDate(this.today);

  protected readonly days: Day[] = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(
      this.today.getFullYear(),
      this.today.getMonth(),
      this.today.getDate() + i,
    );
    return { iso: toIsoDate(date), label: i === 0 ? 'Today' : weekdayName(date) };
  });

  private readonly queryParams = toSignal(this.route.queryParamMap, { requireSync: true });

  protected readonly selectedDate = computed(() => {
    const raw = this.queryParams().get('date');
    return parseIsoDate(raw) && raw !== null && raw >= this.todayIso ? raw : this.todayIso;
  });

  protected readonly pickerControl = new FormControl<Date | null>(null);

  protected readonly status = signal<'loading' | 'error' | 'loaded'>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);

  protected readonly cards = computed<MovieCard[]>(() => {
    const date = this.selectedDate();
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
    effect(() => this.syncPicker(this.selectedDate()));
    this.load();
  }

  protected load(): void {
    this.status.set('loading');
    forkJoin({ movies: this.api.movies(), screenings: this.api.screenings() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ movies, screenings }) => {
          this.movies.set(movies);
          this.screenings.set(screenings);
          this.status.set('loaded');
        },
        error: () => this.status.set('error'),
      });
  }

  protected selectDay(iso: string): void {
    this.router.navigate([], { queryParams: { date: iso } });
  }

  protected onPick(value: Date | null): void {
    if (!value) return;
    const iso = toIsoDate(value);
    if (iso < this.todayIso) return;
    this.syncPicker(iso);
    this.selectDay(iso);
  }

  protected openScreening(id: number): void {
    this.router.navigate(['/screenings', id, 'seats']);
  }

  private syncPicker(iso: string): void {
    const inButtons = this.days.some((d) => d.iso === iso);
    this.pickerControl.setValue(inButtons ? null : parseIsoDate(iso), { emitEvent: false });
  }
}
