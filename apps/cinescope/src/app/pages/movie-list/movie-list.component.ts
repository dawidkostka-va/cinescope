import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Movie, Screening } from '../../core/models';
import { addDays, normalizeSelectedDate, parseIso, toIso, todayIso, weekdayName } from '../../core/date.util';

interface DayOption {
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
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.component.html',
  styleUrl: './movie-list.component.scss',
})
export class MovieListComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly queryDate = toSignal(this.route.queryParamMap.pipe(map((params) => params.get('date'))), {
    initialValue: null,
  });

  readonly selectedDate = computed(() => normalizeSelectedDate(this.queryDate()));
  readonly selectedDateObj = computed(() => parseIso(this.selectedDate()) ?? new Date());
  readonly todayDateObj = parseIso(todayIso()) ?? new Date();

  readonly dayOptions = computed<DayOption[]>(() => {
    const today = todayIso();
    const options: DayOption[] = [{ iso: today, label: 'Today' }];
    for (let i = 1; i <= 4; i++) {
      const iso = addDays(today, i);
      options.push({ iso, label: weekdayName(iso) });
    }
    return options;
  });

  readonly state = signal<LoadState>('loading');
  readonly movies = signal<Movie[]>([]);
  readonly screenings = signal<Screening[]>([]);

  readonly cards = computed<MovieCard[]>(() => {
    const screenings = this.screenings();
    return this.movies()
      .map((movie) => ({
        movie,
        screenings: screenings.filter((s) => s.movieId === movie.id).sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  constructor() {
    effect(() => {
      const date = this.selectedDate();
      this.load(date);
    });
  }

  private load(date: string): void {
    this.state.set('loading');
    forkJoin([this.api.getMovies(), this.api.getScreeningsByDate(date)]).subscribe({
      next: ([movies, screenings]) => {
        this.movies.set(movies);
        this.screenings.set(screenings);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }

  retry(): void {
    this.load(this.selectedDate());
  }

  selectDay(iso: string): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { date: iso }, queryParamsHandling: 'merge' });
  }

  onDatePicked(date: Date | null): void {
    if (!date) return;
    this.selectDay(toIso(date));
  }

  openSeats(screeningId: number): void {
    this.router.navigate(['/screenings', screeningId, 'seats']);
  }
}
