import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Movie, Screening } from '../../core/models/api.model';
import { MoviesApiService } from '../../core/services/movies-api.service';
import { addDays, parseIsoDate, resolveSelectedIsoDate, toIsoDate, todayIsoDate, weekdayName } from '../../core/util/date.util';

interface MovieEntry {
  movie: Movie;
  screenings: Screening[];
}

interface QuickDay {
  iso: string;
  label: string;
}

type Status = 'loading' | 'error' | 'loaded';

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly moviesApi = inject(MoviesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly queryParamMap = toSignal(this.route.queryParamMap, { requireSync: true });

  protected readonly selectedIso = computed(() => resolveSelectedIsoDate(this.queryParamMap().get('date')));
  protected readonly minDate = new Date();
  protected readonly datepickerValue = computed(() => parseIsoDate(this.selectedIso()));

  protected readonly quickDays = computed<QuickDay[]>(() => {
    const today = todayIsoDate();
    return [0, 1, 2, 3, 4].map((offset) => {
      const iso = addDays(today, offset);
      return { iso, label: offset === 0 ? 'Today' : weekdayName(iso) };
    });
  });

  protected readonly status = signal<Status>('loading');
  protected readonly movies = signal<MovieEntry[]>([]);

  constructor() {
    effect(() => this.load(this.selectedIso()));
  }

  protected selectDay(iso: string): void {
    this.navigateToDate(iso);
  }

  protected onDatePicked(date: Date | null): void {
    if (!date) return;
    this.navigateToDate(toIsoDate(date));
  }

  protected openScreening(screeningId: number): void {
    this.router.navigate(['/screenings', screeningId, 'seats']);
  }

  protected retry(): void {
    this.load(this.selectedIso());
  }

  private navigateToDate(iso: string): void {
    this.router.navigate(['/'], { queryParams: { date: iso } });
  }

  private load(date: string): void {
    this.status.set('loading');
    forkJoin({
      movies: this.moviesApi.getMovies(),
      screenings: this.moviesApi.getScreeningsByDate(date),
    }).subscribe({
      next: ({ movies, screenings }) => {
        const entries: MovieEntry[] = movies
          .map((movie) => ({
            movie,
            screenings: screenings.filter((screening) => screening.movieId === movie.id).sort((a, b) => a.time.localeCompare(b.time)),
          }))
          .filter((entry) => entry.screenings.length > 0);
        this.movies.set(entries);
        this.status.set('loaded');
      },
      error: () => {
        this.status.set('error');
      },
    });
  }
}
