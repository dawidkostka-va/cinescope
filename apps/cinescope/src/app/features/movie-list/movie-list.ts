import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { addDays, parseIsoDate, toIsoDate, today, weekdayName } from '../../core/date-utils';
import { Movie, Screening } from '../../core/models';

interface DayButton {
  label: string;
  iso: string;
}

interface MovieCardView {
  movie: Movie;
  screenings: Screening[];
}

type Status = 'loading' | 'error' | 'loaded';

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule, RouterLink],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly queryDate = toSignal(this.route.queryParamMap, { requireSync: true });

  protected readonly dayButtons: DayButton[] = this.buildDayButtons();
  protected readonly minDate = today();

  protected readonly selectedIso = computed(() => {
    const raw = this.queryDate().get('date');
    const todayIso = toIsoDate(today());
    if (!raw) return todayIso;
    const parsed = parseIsoDate(raw);
    if (!parsed || parsed < today()) return todayIso;
    return raw;
  });

  protected readonly selectedButtonIso = computed(() => {
    const iso = this.selectedIso();
    return this.dayButtons.some((b) => b.iso === iso) ? iso : null;
  });

  protected readonly datepickerValue = computed(() => {
    if (this.selectedButtonIso()) return null;
    return parseIsoDate(this.selectedIso());
  });

  protected readonly status = signal<Status>('loading');
  protected readonly movies = signal<Movie[]>([]);
  protected readonly screenings = signal<Screening[]>([]);
  private readonly reloadTrigger = signal(0);

  protected readonly cards = computed<MovieCardView[]>(() => {
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
      this.reloadTrigger();
      this.load(this.selectedIso());
    });
  }

  private buildDayButtons(): DayButton[] {
    const t = today();
    const buttons: DayButton[] = [{ label: 'Today', iso: toIsoDate(t) }];
    for (let i = 1; i <= 4; i++) {
      const date = addDays(t, i);
      buttons.push({ label: weekdayName(date), iso: toIsoDate(date) });
    }
    return buttons;
  }

  protected selectDay(iso: string): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { date: iso } });
  }

  protected onDatepickerChange(date: Date | null): void {
    if (!date) return;
    this.selectDay(toIsoDate(date));
  }

  private load(date: string): void {
    this.status.set('loading');
    forkJoin({
      movies: this.api.getMovies(),
      screenings: this.api.getScreenings(date),
    }).subscribe({
      next: ({ movies, screenings }) => {
        this.movies.set(movies);
        this.screenings.set(screenings);
        this.status.set('loaded');
      },
      error: () => this.status.set('error'),
    });
  }

  protected retry(): void {
    this.reloadTrigger.update((n) => n + 1);
  }
}
