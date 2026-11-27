import { Component, computed, effect, inject, resource } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { firstValueFrom, forkJoin } from 'rxjs';
import { CinemaApi } from '../cinema-api';
import { addDays, isoToDate, isValidIsoDate, startOfToday, toIsoDate, weekdayName } from '../dates';
import { Movie, Screening } from '../models';

interface DayOption {
  iso: string;
  label: string;
}

interface MovieCard {
  movie: Movie;
  screenings: Screening[];
}

@Component({
  selector: 'app-movie-list',
  imports: [RouterLink, MatButton, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly today = startOfToday();
  protected readonly todayIso = toIsoDate(this.today);

  protected readonly days: DayOption[] = Array.from({ length: 5 }, (_, index) => {
    const date = addDays(this.today, index);
    return { iso: toIsoDate(date), label: index === 0 ? 'Today' : weekdayName(date) };
  });

  private readonly query = toSignal(this.route.queryParamMap, { requireSync: true });

  /** The selected day: the `date` query parameter when it is a valid ISO date not before today, otherwise today. */
  protected readonly selectedIso = computed(() => {
    const requested = this.query().get('date');
    return isValidIsoDate(requested) && requested >= this.todayIso ? requested : this.todayIso;
  });

  protected readonly pickerValue = computed(() => isoToDate(this.selectedIso()));

  protected readonly data = resource({
    params: () => this.selectedIso(),
    loader: ({ params: date }) =>
      firstValueFrom(
        forkJoin({
          movies: this.api.getMovies(),
          screenings: this.api.getScreenings(date),
        }),
      ),
  });

  protected readonly cards = computed<MovieCard[]>(() => {
    const data = this.data.value();
    if (!data) {
      return [];
    }
    return data.movies.flatMap((movie) => {
      const screenings = data.screenings
        .filter((screening) => screening.movieId === movie.id)
        .sort((a, b) => a.time.localeCompare(b.time));
      return screenings.length > 0 ? [{ movie, screenings }] : [];
    });
  });

  constructor() {
    // Replace an invalid or past `date` in the URL with the day that is actually shown.
    effect(() => {
      const requested = this.query().get('date');
      const selected = this.selectedIso();
      if (requested !== null && requested !== selected) {
        void this.router.navigate([], { relativeTo: this.route, queryParams: { date: selected }, replaceUrl: true });
      }
    });
  }

  protected selectDay(iso: string): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { date: iso } });
  }

  protected onDatePicked(date: Date | null): void {
    if (date !== null) {
      this.selectDay(toIsoDate(date));
    }
  }
}
