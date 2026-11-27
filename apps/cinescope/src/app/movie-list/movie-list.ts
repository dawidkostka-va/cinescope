import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { addDays, parseIsoDate, startOfToday, toIsoDate, weekdayName } from '../core/dates';
import { Movie, Screening } from '../core/models';

interface Day {
  iso: string;
  label: string;
}

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule, RouterLink],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly queryParams = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: true });

  protected readonly today = startOfToday();
  private readonly todayIso = toIsoDate(this.today);
  protected readonly days: Day[] = Array.from({ length: 5 }, (_, i) => {
    const date = addDays(this.today, i);
    return { iso: toIsoDate(date), label: i === 0 ? 'Today' : weekdayName(date) };
  });

  protected readonly selectedIso = computed(() => {
    const raw = this.queryParams().get('date');
    return raw !== null && parseIsoDate(raw) && raw >= this.todayIso ? raw : this.todayIso;
  });

  protected readonly pickerValue = computed(() => {
    const iso = this.selectedIso();
    return this.days.some((d) => d.iso === iso) ? null : parseIsoDate(iso);
  });

  protected readonly state = signal<'loading' | 'error' | 'loaded'>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);

  protected readonly cards = computed(() => {
    const date = this.selectedIso();
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
  }

  protected load(): void {
    this.state.set('loading');
    forkJoin([this.api.movies(), this.api.screenings()])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([movies, screenings]) => {
          this.movies.set(movies);
          this.screenings.set(screenings);
          this.state.set('loaded');
        },
        error: () => this.state.set('error'),
      });
  }

  protected select(iso: string): void {
    this.router.navigate([], { queryParams: { date: iso } });
  }

  protected pick(date: Date | null): void {
    if (!date) return;
    const iso = toIsoDate(date);
    if (iso >= this.todayIso) this.select(iso);
  }
}
