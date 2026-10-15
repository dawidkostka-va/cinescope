import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, map } from 'rxjs';
import { Movie } from '../../core/models/movie.model';
import { MoviesService } from '../../core/services/movies.service';
import { DayButton, buildDayButtons, formatIsoDate, normalizeDate, parseIsoDate, todayIso } from '../../shared/date-utils';

interface MovieCard extends Movie {
  screenings: { id: number; time: string }[];
}

type LoadStatus = 'loading' | 'error' | 'loaded';

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.component.html',
  styleUrl: './movie-list.component.scss',
})
export class MovieListComponent {
  private readonly moviesService = inject(MoviesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly queryDate = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('date'))),
    { initialValue: null as string | null },
  );

  readonly selectedDate = computed(() => normalizeDate(this.queryDate()));
  readonly dayButtons: DayButton[] = buildDayButtons(todayIso());
  readonly minDate = parseIsoDate(todayIso());

  readonly status = signal<LoadStatus>('loading');
  readonly movies = signal<MovieCard[]>([]);

  readonly datepickerValue = computed<Date | null>(() => {
    const date = this.selectedDate();
    return this.dayButtons.some((button) => button.date === date) ? null : parseIsoDate(date);
  });

  constructor() {
    effect(() => {
      const date = this.selectedDate();
      this.load(date);
    });
  }

  private load(date: string): void {
    this.status.set('loading');
    forkJoin({
      movies: this.moviesService.getMovies(),
      screenings: this.moviesService.getScreeningsByDate(date),
    }).subscribe({
      next: ({ movies, screenings }) => {
        const screeningsByMovie = new Map<number, { id: number; time: string }[]>();
        for (const screening of screenings) {
          const list = screeningsByMovie.get(screening.movieId) ?? [];
          list.push({ id: screening.id, time: screening.time });
          screeningsByMovie.set(screening.movieId, list);
        }

        const cards: MovieCard[] = [];
        for (const movie of movies) {
          const movieScreenings = screeningsByMovie.get(movie.id);
          if (movieScreenings && movieScreenings.length > 0) {
            cards.push({
              ...movie,
              screenings: [...movieScreenings].sort((a, b) => a.time.localeCompare(b.time)),
            });
          }
        }
        this.movies.set(cards);
        this.status.set('loaded');
      },
      error: () => this.status.set('error'),
    });
  }

  retry(): void {
    this.load(this.selectedDate());
  }

  selectDate(date: string): void {
    this.router.navigate([], { queryParams: { date }, queryParamsHandling: 'merge' });
  }

  onDatepickerChange(date: Date | null): void {
    if (date) {
      this.selectDate(formatIsoDate(date));
    }
  }

  openScreening(screeningId: number): void {
    this.router.navigate(['/screenings', screeningId, 'seats']);
  }
}
