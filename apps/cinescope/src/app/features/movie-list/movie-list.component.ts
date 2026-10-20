import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { Movie } from '../../core/models/movie.model';
import { Screening } from '../../core/models/screening.model';
import { isoToday, resolveSelectedDate } from '../../core/utils/date.util';
import { DayPickerComponent } from './day-picker.component';

interface MovieCardVm {
  movie: Movie;
  screenings: Screening[];
}

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, DayPickerComponent],
  templateUrl: './movie-list.component.html',
  styleUrl: './movie-list.component.scss',
})
export class MovieListComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly todayIso = isoToday();
  private readonly queryDate = toSignal(this.route.queryParamMap.pipe(map((params) => params.get('date'))), {
    initialValue: null,
  });

  readonly selectedDate = computed(() => resolveSelectedDate(this.queryDate(), this.todayIso));

  readonly loading = signal(false);
  readonly error = signal(false);
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);

  readonly cards = computed<MovieCardVm[]>(() => {
    const date = this.selectedDate();
    const byMovie = new Map<number, Screening[]>();
    for (const screening of this.screenings()) {
      if (screening.date !== date) continue;
      const list = byMovie.get(screening.movieId) ?? [];
      list.push(screening);
      byMovie.set(screening.movieId, list);
    }
    return this.movies()
      .map((movie) => ({
        movie,
        screenings: (byMovie.get(movie.id) ?? []).slice().sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  constructor() {
    effect(() => {
      this.load(this.selectedDate());
    });
  }

  private load(date: string): void {
    this.loading.set(true);
    this.error.set(false);
    forkJoin({
      movies: this.api.getMovies(),
      screenings: this.api.getScreeningsByDate(date),
    }).subscribe({
      next: ({ movies, screenings }) => {
        this.movies.set(movies);
        this.screenings.set(screenings);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  retry(): void {
    this.load(this.selectedDate());
  }

  selectDay(iso: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { date: iso },
      queryParamsHandling: 'merge',
    });
  }

  openScreening(screeningId: number): void {
    this.router.navigate(['/screenings', screeningId, 'seats']);
  }
}
