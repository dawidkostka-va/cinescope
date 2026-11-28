import { Component, DestroyRef, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerInput, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, forkJoin, map } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Movie, Screening } from '../core/models';
import { parseIsoDate, toIsoDate, weekdayName } from '../core/seating';

interface Day {
  iso: string;
  label: string;
}

interface MovieCard {
  movie: Movie;
  screenings: Screening[];
}

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieListComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly today = (() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  })();
  private readonly todayIso = toIsoDate(this.today);

  protected readonly days: Day[] = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(this.today);
    date.setDate(this.today.getDate() + i);
    return { iso: toIsoDate(date), label: i === 0 ? 'Today' : weekdayName(date) };
  });

  private readonly dateParam = toSignal(this.route.queryParamMap.pipe(map((p) => p.get('date'))), {
    initialValue: this.route.snapshot.queryParamMap.get('date'),
  });

  protected readonly selectedIso = computed(() => {
    const date = parseIsoDate(this.dateParam());
    if (!date) return this.todayIso;
    const iso = toIsoDate(date);
    return iso < this.todayIso ? this.todayIso : iso;
  });

  protected readonly pickerValue = computed(() => {
    const iso = this.selectedIso();
    return this.days.some((d) => d.iso === iso) ? null : parseIsoDate(iso);
  });

  protected readonly state = signal<'loading' | 'error' | 'loaded'>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);

  protected readonly cards = computed<MovieCard[]>(() => {
    const iso = this.selectedIso();
    const day = this.screenings().filter((s) => s.date === iso);
    return this.movies()
      .map((movie) => ({
        movie,
        screenings: day.filter((s) => s.movieId === movie.id).sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  private readonly pickerInput = viewChild(MatDatepickerInput);
  private request?: Subscription;

  constructor() {
    this.load();
  }

  protected load(): void {
    this.request?.unsubscribe();
    this.state.set('loading');
    this.request = forkJoin({ movies: this.api.movies(), screenings: this.api.screenings() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ movies, screenings }) => {
          this.movies.set(movies);
          this.screenings.set(screenings);
          this.state.set('loaded');
        },
        error: () => this.state.set('error'),
      });
  }

  protected selectDay(iso: string): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { date: iso } });
  }

  protected onPick(value: Date | null): void {
    if (!value || isNaN(value.getTime())) return;
    const iso = toIsoDate(value);
    const input = this.pickerInput();
    if (iso < this.todayIso) {
      if (input) input.value = this.pickerValue();
      return;
    }
    if (input && this.days.some((d) => d.iso === iso)) input.value = null;
    this.selectDay(iso);
  }

  protected openSeats(screening: Screening): void {
    this.router.navigate(['/screenings', screening.id, 'seats']);
  }
}
