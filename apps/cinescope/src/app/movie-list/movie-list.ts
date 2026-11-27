import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { addDays, parseIsoDate, toIsoDate, weekdayName } from '../core/dates';
import { Movie, Screening } from '../core/models';

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatCardModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private request: Subscription | null = null;

  protected readonly today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  private readonly todayIso = toIsoDate(this.today);

  protected readonly days = Array.from({ length: 5 }, (_, i) => {
    const date = addDays(this.today, i);
    return { iso: toIsoDate(date), label: i === 0 ? 'Today' : weekdayName(date) };
  });

  private readonly queryParams = toSignal(this.route.queryParamMap, { requireSync: true });

  protected readonly selected = computed(() => {
    const raw = this.queryParams().get('date');
    return raw !== null && parseIsoDate(raw) && raw >= this.todayIso ? raw : this.todayIso;
  });

  protected readonly pickerValue = computed(() =>
    this.days.some((day) => day.iso === this.selected()) ? null : parseIsoDate(this.selected()),
  );

  protected readonly status = signal<'loading' | 'error' | 'loaded'>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);

  protected readonly cards = computed(() => {
    const date = this.selected();
    const onDay = this.screenings().filter((s) => s.date === date);
    return this.movies()
      .map((movie) => ({
        movie,
        screenings: onDay.filter((s) => s.movieId === movie.id).sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  constructor() {
    this.load();
    this.destroyRef.onDestroy(() => this.request?.unsubscribe());
  }

  protected load(): void {
    this.request?.unsubscribe();
    this.status.set('loading');
    this.request = forkJoin({ movies: this.api.movies(), screenings: this.api.screenings() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ movies, screenings }) => {
          this.movies.set(movies);
          this.screenings.set(screenings);
          this.status.set('loaded');
        },
        error: () => this.status.set('error'),
      });
  }

  protected selectDay(iso: string): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { date: iso } });
  }

  protected pickDate(event: MatDatepickerInputEvent<Date>): void {
    const date = event.value;
    if (date && date >= this.today) {
      this.selectDay(toIsoDate(date));
    }
  }

  protected openScreening(id: number): void {
    this.router.navigate(['/screenings', id, 'seats']);
  }
}
