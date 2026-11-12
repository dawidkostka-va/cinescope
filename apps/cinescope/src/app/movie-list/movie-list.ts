import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../core/api.service';
import { addDays, parseIso, toIso, weekdayName } from '../core/dates';
import { Movie, Screening } from '../core/models';

type LoadState = 'loading' | 'error' | 'loaded';

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly queryParams = toSignal(inject(ActivatedRoute).queryParamMap);

  private readonly todayDate = (() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  })();
  protected readonly today = toIso(this.todayDate);
  protected readonly minDate = this.todayDate;

  protected readonly days = Array.from({ length: 5 }, (_, i) => {
    const d = addDays(this.todayDate, i);
    return { date: toIso(d), label: i === 0 ? 'Today' : weekdayName(d) };
  });

  protected readonly selectedDate = computed(() => {
    const raw = this.queryParams()?.get('date') ?? null;
    return parseIso(raw) && (raw as string) >= this.today ? (raw as string) : this.today;
  });

  protected readonly pickerDate = computed(() => {
    const selected = this.selectedDate();
    return this.days.some((d) => d.date === selected) ? null : parseIso(selected);
  });

  protected readonly state = signal<LoadState>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);

  protected readonly cards = computed(() => {
    const date = this.selectedDate();
    const onDay = this.screenings().filter((s) => s.date === date);
    return this.movies()
      .map((movie) => ({
        movie,
        screenings: onDay
          .filter((s) => s.movieId === movie.id)
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  private request?: Subscription;

  constructor() {
    this.load();
    this.destroyRef.onDestroy(() => this.request?.unsubscribe());
  }

  protected load(): void {
    this.request?.unsubscribe();
    this.state.set('loading');
    this.request = this.api
      .loadMoviesAndScreenings()
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

  protected selectDay(date: string): void {
    this.router.navigate(['/'], { queryParams: { date } });
  }

  protected pickDate(event: MatDatepickerInputEvent<Date>): void {
    const value = event.value;
    if (!value) return;
    const date = toIso(value);
    if (date >= this.today) this.selectDay(date);
  }

  protected openSeats(screeningId: number): void {
    this.router.navigate(['/screenings', screeningId, 'seats']);
  }
}
