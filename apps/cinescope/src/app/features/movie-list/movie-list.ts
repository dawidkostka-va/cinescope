import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiService } from '../../core/api.service';
import { addDays, isValidIsoDate, parseIsoDate, startOfDay, toIsoDate, weekdayFull } from '../../core/date.util';
import { Movie, Screening } from '../../core/models';

interface DayButton {
  date: string;
  label: string;
}

interface MovieEntry {
  movie: Movie;
  screenings: Screening[];
}

type Status = 'loading' | 'error' | 'loaded';

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly queryParamMap = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  private readonly today = startOfDay(new Date());
  readonly minDate = this.today;

  readonly status = signal<Status>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);

  readonly selectedDate = computed(() => {
    const raw = this.queryParamMap().get('date');
    const todayIso = toIsoDate(this.today);
    if (!raw || !isValidIsoDate(raw) || raw < todayIso) return todayIso;
    return raw;
  });

  readonly datepickerValue = computed(() => parseIsoDate(this.selectedDate()));

  readonly dayButtons = computed<DayButton[]>(() => {
    const buttons: DayButton[] = [];
    for (let i = 0; i < 5; i++) {
      const date = addDays(this.today, i);
      buttons.push({ date: toIsoDate(date), label: i === 0 ? 'Today' : weekdayFull(date) });
    }
    return buttons;
  });

  readonly moviesForDay = computed<MovieEntry[]>(() => {
    const date = this.selectedDate();
    const entries: MovieEntry[] = [];
    for (const movie of this.movies()) {
      const screenings = this.screenings()
        .filter((s) => s.movieId === movie.id && s.date === date)
        .sort((a, b) => a.time.localeCompare(b.time));
      if (screenings.length > 0) {
        entries.push({ movie, screenings });
      }
    }
    return entries;
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.status.set('loading');
    this.api.getMoviesAndScreenings().subscribe({
      next: ({ movies, screenings }) => {
        this.movies.set(movies);
        this.screenings.set(screenings);
        this.status.set('loaded');
      },
      error: () => this.status.set('error'),
    });
  }

  selectDate(date: string): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { date } });
  }

  onDatepickerChange(date: Date | null): void {
    if (!date) return;
    this.selectDate(toIsoDate(date));
  }

  openScreening(screeningId: number): void {
    this.router.navigate(['/screenings', screeningId, 'seats']);
  }
}
