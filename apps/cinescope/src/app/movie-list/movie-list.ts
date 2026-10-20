import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { MovieWithScreenings } from '../core/models';
import { buildDayOptions, dateToIso, isoToDate, resolveSelectedDate, todayIso } from '../core/date-utils';

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly today = todayIso();
  protected readonly todayDateObj = isoToDate(this.today);
  protected readonly days = buildDayOptions(this.today);

  protected readonly selectedDate = signal(this.today);
  protected readonly selectedDateObj = computed(() => isoToDate(this.selectedDate()));

  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly movies = signal<MovieWithScreenings[]>([]);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const dateParam = params.get('date');
      const resolved = resolveSelectedDate(dateParam);
      if (resolved !== dateParam) {
        this.router.navigate([], { queryParams: { date: resolved }, replaceUrl: true });
        return;
      }
      this.selectedDate.set(resolved);
      this.load();
    });
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(false);
    const date = this.selectedDate();
    forkJoin([this.api.getMovies(), this.api.getScreeningsByDate(date)]).subscribe({
      next: ([movies, screenings]) => {
        const byMovie = new Map<number, typeof screenings>();
        for (const screening of screenings) {
          const list = byMovie.get(screening.movieId) ?? [];
          list.push(screening);
          byMovie.set(screening.movieId, list);
        }
        this.movies.set(
          movies
            .filter((movie) => byMovie.has(movie.id))
            .map((movie) => ({
              ...movie,
              screenings: (byMovie.get(movie.id) ?? []).slice().sort((a, b) => a.time.localeCompare(b.time)),
            })),
        );
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  protected retry(): void {
    this.load();
  }

  protected selectDate(date: string): void {
    this.router.navigate([], { queryParams: { date } });
  }

  protected onDatePicked(event: MatDatepickerInputEvent<Date>): void {
    if (!event.value) {
      return;
    }
    this.selectDate(dateToIso(event.value));
  }

  protected openScreening(screeningId: number): void {
    this.router.navigate(['/screenings', screeningId, 'seats']);
  }
}
