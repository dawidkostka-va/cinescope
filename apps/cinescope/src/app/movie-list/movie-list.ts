import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map } from 'rxjs';
import { addDays, englishWeekday, parseIsoDate, startOfDay, toIsoDate } from '../date-utils';
import { API_BASE_URL, Movie, Screening } from '../models';

interface DayOption {
  iso: string;
  label: string;
}

interface MovieCard {
  movie: Movie;
  screenings: Screening[];
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; movies: Movie[]; screenings: Screening[] };

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly today = startOfDay(new Date());
  protected readonly todayIso = toIsoDate(this.today);
  protected readonly todayDate = this.today;

  /** Today and the next four days; the first is labelled `Today`. */
  protected readonly days: DayOption[] = Array.from({ length: 5 }, (_, offset) => {
    const date = addDays(this.today, offset);
    return { iso: toIsoDate(date), label: offset === 0 ? 'Today' : englishWeekday(date) };
  });

  private readonly queryDate = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('date'))),
    { initialValue: null },
  );

  /** The selected day; a missing, invalid or past `date` selects today. */
  protected readonly selectedIso = computed(() => {
    const requested = this.queryDate();
    if (requested && parseIsoDate(requested) && requested >= this.todayIso) {
      return requested;
    }
    return this.todayIso;
  });

  /** The day chosen in the datepicker, shown only when it is not one of the five day buttons. */
  protected readonly pickedDate = computed(() => {
    const iso = this.selectedIso();
    return this.days.some((day) => day.iso === iso) ? null : parseIsoDate(iso);
  });

  protected readonly state = signal<LoadState>({ status: 'loading' });

  /** Movies with at least one screening on the selected day, in backend order. */
  protected readonly cards = computed<MovieCard[]>(() => {
    const state = this.state();
    if (state.status !== 'loaded') {
      return [];
    }
    const date = this.selectedIso();
    const onDay = state.screenings.filter((screening) => screening.date === date);
    return state.movies.flatMap((movie) => {
      const screenings = onDay
        .filter((screening) => screening.movieId === movie.id)
        .sort((a, b) => a.time.localeCompare(b.time));
      return screenings.length > 0 ? [{ movie, screenings }] : [];
    });
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set({ status: 'loading' });
    forkJoin({
      movies: this.http.get<Movie[]>(`${API_BASE_URL}/movies`),
      screenings: this.http.get<Screening[]>(`${API_BASE_URL}/screenings`),
    }).subscribe({
      next: (data) => this.state.set({ status: 'loaded', ...data }),
      error: () => this.state.set({ status: 'error' }),
    });
  }

  protected selectDay(iso: string): void {
    this.router.navigate(['/'], { queryParams: { date: iso } });
  }

  /** The datepicker also reports typed dates; dates before today cannot be chosen (section 4.1). */
  protected onDatePicked(date: Date | null): void {
    if (date && toIsoDate(date) >= this.todayIso) {
      this.selectDay(toIsoDate(date));
    }
  }

  protected openSeats(screeningId: number): void {
    this.router.navigate(['/screenings', screeningId, 'seats']);
  }
}
