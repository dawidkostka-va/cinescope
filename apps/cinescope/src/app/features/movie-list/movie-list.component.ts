import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { isValidIso, todayIso } from '../../core/date-utils';
import { Movie, Screening } from '../../core/models';
import { DayPickerComponent } from './day-picker.component';

@Component({
  selector: 'app-movie-list',
  imports: [DayPickerComponent, MatButtonModule],
  templateUrl: './movie-list.component.html',
  styleUrl: './movie-list.component.scss',
})
export class MovieListComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly queryDate = toSignal(this.route.queryParamMap, { requireSync: true });

  protected readonly selectedDate = computed(() => {
    const raw = this.queryDate().get('date');
    if (!raw || !isValidIso(raw) || raw < todayIso()) {
      return todayIso();
    }
    return raw;
  });

  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly movies = signal<Movie[]>([]);
  protected readonly screenings = signal<Screening[]>([]);

  protected readonly moviesForDay = computed(() => {
    const date = this.selectedDate();
    const screenings = this.screenings();
    return this.movies().filter((movie) => screenings.some((screening) => screening.movieId === movie.id && screening.date === date));
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(false);
    forkJoin({ movies: this.api.getMovies(), screenings: this.api.getScreenings() }).subscribe({
      next: ({ movies, screenings }) => {
        this.movies.set(movies);
        this.screenings.set(screenings);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  protected screeningsForMovie(movieId: number): Screening[] {
    const date = this.selectedDate();
    return this.screenings()
      .filter((screening) => screening.movieId === movieId && screening.date === date)
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  protected onDateSelected(iso: string): void {
    this.router.navigate(['/'], { queryParams: { date: iso } });
  }

  protected openScreening(screeningId: number): void {
    this.router.navigate(['/screenings', screeningId, 'seats']);
  }
}
