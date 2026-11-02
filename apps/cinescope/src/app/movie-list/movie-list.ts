import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { CinemaApi } from '../cinema.api';
import { addDays, parseIsoDate, startOfToday, toIsoDate, weekdayName } from '../dates';
import { Movie, Screening } from '../models';

interface DayOption {
  date: Date;
  iso: string;
  label: string;
}

interface MovieCard {
  movie: Movie;
  screenings: Screening[];
}

type LoadState = 'loading' | 'error' | 'loaded';

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatInputModule, RouterLink],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovieList {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private readonly today = startOfToday();
  private readonly queryDate = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('date'))),
    { initialValue: this.route.snapshot.queryParamMap.get('date') },
  );

  readonly minDate = this.today;
  readonly dayOptions: DayOption[] = Array.from({ length: 5 }, (_, index) => {
    const date = addDays(this.today, index);
    return {
      date,
      iso: toIsoDate(date),
      label: index === 0 ? 'Today' : weekdayName(date),
    };
  });

  readonly state = signal<LoadState>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);

  readonly selectedDate = computed(() => {
    const parsed = parseIsoDate(this.queryDate());
    return parsed && parsed >= this.today ? parsed : this.today;
  });

  readonly selectedIso = computed(() => toIsoDate(this.selectedDate()));

  readonly pickerDate = computed(() =>
    this.dayOptions.some((day) => day.iso === this.selectedIso()) ? null : this.selectedDate(),
  );

  readonly cards = computed<MovieCard[]>(() => {
    const iso = this.selectedIso();
    const dayScreenings = this.screenings().filter((screening) => screening.date === iso);
    return this.movies()
      .map((movie) => ({
        movie,
        screenings: dayScreenings
          .filter((screening) => screening.movieId === movie.id)
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  constructor() {
    this.load();
  }

  load(): void {
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

  selectDate(date: Date | null): void {
    if (!date || date < this.today) {
      return;
    }
    void this.router.navigate(['/'], { queryParams: { date: toIsoDate(date) } });
  }
}
