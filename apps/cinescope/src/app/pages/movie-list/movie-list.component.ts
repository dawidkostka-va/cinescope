import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { addDays, dateToIso, isoToDate, resolveSelectedDate, todayIso, weekdayFull } from '../../core/date-utils';
import { Movie, Screening } from '../../core/models';
import { MoviesService } from '../../core/movies.service';
import { ScreeningsService } from '../../core/screenings.service';

type Status = 'loading' | 'error' | 'loaded';

interface DayButton {
  date: string;
  label: string;
}

interface MovieEntry {
  movie: Movie;
  screenings: Screening[];
}

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.component.html',
  styleUrl: './movie-list.component.scss',
})
export class MovieListComponent {
  private readonly moviesService = inject(MoviesService);
  private readonly screeningsService = inject(ScreeningsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly queryParamMap = toSignal(this.route.queryParamMap, { requireSync: true });

  readonly today = todayIso();
  readonly minDate = isoToDate(this.today);

  readonly selectedDate = computed(() => resolveSelectedDate(this.queryParamMap().get('date')));
  readonly datepickerValue = computed(() => isoToDate(this.selectedDate()));

  readonly dayButtons = computed<DayButton[]>(() =>
    Array.from({ length: 5 }, (_, i) => {
      const date = addDays(this.today, i);
      return { date, label: i === 0 ? 'Today' : weekdayFull(date) };
    }),
  );

  readonly status = signal<Status>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);

  readonly visibleMovies = computed<MovieEntry[]>(() => {
    if (this.status() !== 'loaded') return [];
    const date = this.selectedDate();
    const screenings = this.screenings();
    return this.movies()
      .map((movie) => ({
        movie,
        screenings: screenings
          .filter((screening) => screening.movieId === movie.id && screening.date === date)
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((entry) => entry.screenings.length > 0);
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.status.set('loading');
    forkJoin({
      movies: this.moviesService.getAll(),
      screenings: this.screeningsService.getAll(),
    }).subscribe({
      next: ({ movies, screenings }) => {
        this.movies.set(movies);
        this.screenings.set(screenings);
        this.status.set('loaded');
      },
      error: () => {
        this.status.set('error');
      },
    });
  }

  retry(): void {
    this.load();
  }

  isSelected(date: string): boolean {
    return this.selectedDate() === date;
  }

  selectDate(date: string): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { date } });
  }

  onDatepickerChange(date: Date | null): void {
    if (!date) return;
    this.selectDate(dateToIso(date));
  }

  openScreening(screeningId: number): void {
    this.router.navigate(['/screenings', screeningId, 'seats']);
  }
}
