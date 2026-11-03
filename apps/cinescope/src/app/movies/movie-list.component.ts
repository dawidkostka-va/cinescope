import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { forkJoin, Subscription } from 'rxjs';
import { ApiService } from '../core/api.service';
import { addDays, parseIsoDate, startOfToday, toIsoDate, weekdayName } from '../core/dates';
import { Movie, Screening } from '../core/models';

type LoadState = 'loading' | 'error' | 'loaded';

const today = startOfToday();

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.component.html',
  styleUrl: './movie-list.component.scss',
})
export class MovieListComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly minDate = today;
  readonly dayButtons = [0, 1, 2, 3, 4].map((offset) => {
    const date = addDays(today, offset);
    return { iso: toIsoDate(date), label: offset === 0 ? 'Today' : weekdayName(date) };
  });

  readonly selectedIso = signal(toIsoDate(today));
  readonly state = signal<LoadState>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);
  private request?: Subscription;

  readonly pickerDate = computed(() => {
    const iso = this.selectedIso();
    return this.dayButtons.some((day) => day.iso === iso) ? null : parseIsoDate(iso);
  });

  readonly cards = computed(() => {
    const screenings = this.screenings();
    return this.movies()
      .map((movie) => ({
        movie,
        screenings: screenings
          .filter((screening) => screening.movieId === movie.id)
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const requested = parseIsoDate(params.get('date'));
      const day = requested && requested >= today ? requested : today;
      this.selectedIso.set(toIsoDate(day));
      this.load();
    });
  }

  isSelected(iso: string): boolean {
    return this.selectedIso() === iso;
  }

  selectDay(iso: string): void {
    this.router.navigate([], { queryParams: { date: iso } });
  }

  pickDate(date: Date | null): void {
    if (date) {
      this.selectDay(toIsoDate(date));
    }
  }

  openScreening(id: number): void {
    this.router.navigate(['/screenings', id, 'seats']);
  }

  retry(): void {
    this.load();
  }

  private load(): void {
    this.request?.unsubscribe();
    this.state.set('loading');
    this.request = forkJoin({
      movies: this.api.movies(),
      screenings: this.api.screeningsOn(this.selectedIso()),
    }).subscribe({
      next: ({ movies, screenings }) => {
        this.movies.set(movies);
        this.screenings.set(screenings);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }
}
