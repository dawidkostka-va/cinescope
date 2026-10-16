import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Movie, Screening } from '../../core/models';
import { addDays, resolveSelectedDate, todayIso, weekdayFull } from '../../shared/date-utils';

interface MovieCard {
  movie: Movie;
  screenings: Screening[];
}

interface DayButton {
  date: string;
  label: string;
}

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.component.html',
  styleUrl: './movie-list.component.scss',
})
export class MovieListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);

  protected readonly minDate = parseLocalToday();

  protected readonly dayButtons: DayButton[] = (() => {
    const today = todayIso();
    return [0, 1, 2, 3, 4].map((offset) => {
      const date = addDays(today, offset);
      return { date, label: offset === 0 ? 'Today' : weekdayFull(date) };
    });
  })();

  protected readonly selectedDate = signal(todayIso());
  protected readonly datepickerValue = computed<Date | null>(() => {
    const date = this.selectedDate();
    return this.dayButtons.some((d) => d.date === date) ? null : new Date(date);
  });

  protected readonly loading = signal(false);
  protected readonly error = signal(false);
  protected readonly movies = signal<Movie[]>([]);
  protected readonly screenings = signal<Screening[]>([]);

  protected readonly movieCards = computed<MovieCard[]>(() => {
    const screenings = this.screenings();
    return this.movies()
      .map((movie) => ({
        movie,
        screenings: screenings.filter((s) => s.movieId === movie.id).sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.selectedDate.set(resolveSelectedDate(params.get('date')));
      this.loadMovies();
    });
  }

  protected loadMovies(): void {
    this.loading.set(true);
    this.error.set(false);
    const date = this.selectedDate();
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
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  protected selectDay(date: string): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { date } });
  }

  protected onDatepickerChange(date: Date | null): void {
    if (!date) {
      return;
    }
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    this.selectDay(iso);
  }

  protected openScreening(screeningId: number): void {
    this.router.navigate(['/screenings', screeningId, 'seats']);
  }
}

function parseLocalToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
