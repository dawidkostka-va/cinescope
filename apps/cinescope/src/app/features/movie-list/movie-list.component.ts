import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { resolveSelectedDate, toIsoDate } from '../../core/date-utils';
import { Movie, Screening } from '../../core/models';
import { DayPickerComponent } from './day-picker.component';

interface MovieWithScreenings {
  movie: Movie;
  screenings: Screening[];
}

type LoadStatus = 'loading' | 'error' | 'loaded';

@Component({
  selector: 'app-movie-list',
  imports: [DayPickerComponent, MatButtonModule],
  templateUrl: './movie-list.component.html',
  styleUrl: './movie-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovieListComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly queryParamMap = toSignal(this.route.queryParamMap, { requireSync: true });

  protected readonly selectedDate = computed(() => resolveSelectedDate(this.queryParamMap().get('date')));
  private readonly selectedDateIso = computed(() => toIsoDate(this.selectedDate()));

  protected readonly status = signal<LoadStatus>('loading');
  protected readonly movies = signal<MovieWithScreenings[]>([]);

  constructor() {
    effect(() => {
      this.load(this.selectedDateIso());
    });
  }

  private load(date: string): void {
    this.status.set('loading');
    forkJoin([this.api.getMovies(), this.api.getScreeningsByDate(date)]).subscribe({
      next: ([movies, screenings]) => {
        const screeningsByMovie = new Map<number, Screening[]>();
        for (const screening of screenings) {
          const list = screeningsByMovie.get(screening.movieId);
          if (list) list.push(screening);
          else screeningsByMovie.set(screening.movieId, [screening]);
        }
        this.movies.set(
          movies
            .filter((movie) => screeningsByMovie.has(movie.id))
            .map((movie) => ({
              movie,
              screenings: [...screeningsByMovie.get(movie.id)!].sort((a, b) => a.time.localeCompare(b.time)),
            })),
        );
        this.status.set('loaded');
      },
      error: () => this.status.set('error'),
    });
  }

  protected onDateSelected(date: Date): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { date: toIsoDate(date) } });
  }

  protected retry(): void {
    this.load(this.selectedDateIso());
  }

  protected openSeatMap(screeningId: number): void {
    this.router.navigate(['/screenings', screeningId, 'seats']);
  }
}
