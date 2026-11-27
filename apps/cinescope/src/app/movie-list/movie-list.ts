import { Component, computed, effect, inject, resource } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { CinescopeApi } from '../cinescope-api';
import { addDays, parseIsoDate, startOfToday, toIsoDate, weekdayName } from '../dates';
import { Movie, Screening } from '../models';

interface MovieCard {
  movie: Movie;
  screenings: Screening[];
}

@Component({
  selector: 'app-movie-list',
  imports: [
    MatButton,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinner,
    ReactiveFormsModule,
  ],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(CinescopeApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly today = startOfToday();
  private readonly todayIso = toIsoDate(this.today);

  /** Today plus the next four days; the first one is labelled "Today". */
  protected readonly days = Array.from({ length: 5 }, (_, index) => {
    const date = addDays(this.today, index);
    return { iso: toIsoDate(date), label: index === 0 ? 'Today' : weekdayName(date) };
  });

  protected readonly minDate = this.today;

  private readonly query = toSignal(this.route.queryParamMap, { requireSync: true });

  /** The selected day from `?date=`; a missing, invalid or past date selects today. */
  protected readonly selectedIso = computed(() => {
    const requested = parseIsoDate(this.query().get('date'));
    const iso = requested ? toIsoDate(requested) : this.todayIso;
    return iso >= this.todayIso ? iso : this.todayIso;
  });

  /** The selected day when it is not one of the five buttons, otherwise null. */
  private readonly pickedDate = computed(() => {
    const iso = this.selectedIso();
    return this.days.some((day) => day.iso === iso) ? null : parseIsoDate(iso);
  });

  protected readonly dateControl = new FormControl<Date | null>(null);

  protected readonly movieData = resource({
    loader: () => this.api.loadMovieList(),
  });

  protected readonly loading = computed(() => {
    const status = this.movieData.status();
    return status === 'loading' || status === 'reloading';
  });

  protected readonly failed = computed(() => this.movieData.status() === 'error');

  protected readonly cards = computed<MovieCard[]>(() => {
    const data = this.movieData.value();
    if (!data) {
      return [];
    }
    const iso = this.selectedIso();
    return data.movies
      .map((movie) => ({
        movie,
        screenings: data.screenings
          .filter((screening) => screening.movieId === movie.id && screening.date === iso)
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  constructor() {
    effect(() => {
      this.dateControl.setValue(this.pickedDate(), { emitEvent: false });
    });
  }

  protected selectDay(iso: string): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { date: iso } });
  }

  protected onDatePicked(date: Date | null): void {
    if (date) {
      this.selectDay(toIsoDate(date));
    }
  }

  protected openScreening(id: number): void {
    void this.router.navigate(['/screenings', id, 'seats']);
  }

  protected retry(): void {
    this.movieData.reload();
  }
}
