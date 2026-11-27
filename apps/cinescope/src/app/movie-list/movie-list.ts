import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { API_URL } from '../api';
import { WEEKDAYS, addDays, parseIsoDate, startOfDay, toIsoDate } from '../dates';
import { Movie, Screening } from '../models';

type LoadState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatCardModule, MatDatepickerModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly today = startOfDay(new Date());

  /** Today and the next four days, as shown in the day picker. */
  protected readonly days = [0, 1, 2, 3, 4].map((offset) => {
    const date = addDays(this.today, offset);
    return { iso: toIsoDate(date), label: offset === 0 ? 'Today' : WEEKDAYS[date.getDay()] };
  });

  private readonly queryParams = toSignal(this.route.queryParamMap, { requireSync: true });

  /** The `?date=` day if valid and not in the past, otherwise today. */
  protected readonly selectedDate = computed(() => {
    const requested = parseIsoDate(this.queryParams().get('date'));
    return requested && requested >= this.today ? requested : this.today;
  });
  protected readonly selectedIso = computed(() => toIsoDate(this.selectedDate()));

  /** The datepicker shows the date only when it is not one of the five day buttons. */
  protected readonly pickedDate = computed(() =>
    this.days.some((day) => day.iso === this.selectedIso()) ? null : this.selectedDate(),
  );

  protected readonly state = signal<LoadState>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);

  protected readonly visibleMovies = computed(() => {
    const iso = this.selectedIso();
    const dayScreenings = this.screenings().filter((screening) => screening.date === iso);
    return this.movies()
      .map((movie) => ({
        movie,
        screenings: dayScreenings
          .filter((screening) => screening.movieId === movie.id)
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((entry) => entry.screenings.length > 0);
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    forkJoin({
      movies: this.http.get<Movie[]>(`${API_URL}/movies`),
      screenings: this.http.get<Screening[]>(`${API_URL}/screenings`),
    })
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
    void this.router.navigate([], { relativeTo: this.route, queryParams: { date: iso } });
  }

  protected selectDate(date: Date | null): void {
    if (!date || date < this.today) {
      return;
    }
    this.selectDay(toIsoDate(date));
  }

  protected openScreening(id: number): void {
    void this.router.navigate(['/screenings', id, 'seats']);
  }
}
