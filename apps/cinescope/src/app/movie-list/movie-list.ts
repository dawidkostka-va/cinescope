import { Component, computed, inject, resource } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';
import { ApiService } from '../api.service';
import { addDays, parseIsoDate, startOfDay, toIsoDate, weekdayName } from '../dates';
import { Movie, Screening } from '../models';

interface DayButton {
  iso: string;
  label: string;
}

interface MovieCard {
  movie: Movie;
  screenings: Screening[];
}

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatCardModule, MatDatepickerModule, MatFormFieldModule, MatInputModule, RouterLink],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly today = startOfDay(new Date());
  private readonly todayIso = toIsoDate(this.today);

  readonly minDate = this.today;

  readonly dayButtons: DayButton[] = [0, 1, 2, 3, 4].map((offset) => {
    const date = addDays(this.today, offset);
    return { iso: toIsoDate(date), label: offset === 0 ? 'Today' : weekdayName(date) };
  });

  private readonly queryParams = toSignal(this.route.queryParamMap, { requireSync: true });

  /** The selected day as ISO date; a missing, invalid or past `date` selects today. */
  readonly selectedIso = computed(() => {
    const requested = this.queryParams().get('date');
    if (requested === null || parseIsoDate(requested) === null || requested < this.todayIso) {
      return this.todayIso;
    }
    return requested;
  });

  readonly selectedDate = computed(() => parseIsoDate(this.selectedIso()));

  readonly movies = resource({
    params: () => this.selectedIso(),
    loader: ({ params: date }) =>
      firstValueFrom(
        forkJoin({
          movies: this.api.getMovies(),
          screenings: this.api.getScreeningsByDate(date),
        }),
      ),
  });

  /** One card per movie with at least one screening on the selected day, in backend order. */
  readonly cards = computed<MovieCard[]>(() => {
    if (!this.movies.hasValue()) {
      return [];
    }
    const { movies, screenings } = this.movies.value();
    return movies
      .map((movie) => ({
        movie,
        screenings: screenings
          .filter((screening) => screening.movieId === movie.id)
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  retry(): void {
    this.movies.reload();
  }

  selectDay(iso: string): void {
    this.navigateToDate(iso);
  }

  onDatepickerChange(date: Date | null): void {
    if (!date) {
      return;
    }
    const iso = toIsoDate(date);
    this.navigateToDate(iso < this.todayIso ? this.todayIso : iso);
  }

  private navigateToDate(iso: string): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { date: iso } });
  }
}
