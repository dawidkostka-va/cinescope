import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { addDays, parseIso, startOfToday, toIso, weekdayName } from '../../core/dates';
import { Movie, Screening } from '../../core/models';

interface DayOption {
  iso: string;
  label: string;
}

@Component({
  selector: 'app-movie-list',
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly today = startOfToday();
  private readonly todayIso = toIso(this.today);

  protected readonly days: DayOption[] = Array.from({ length: 5 }, (_, i) => {
    const date = addDays(this.today, i);
    return { iso: toIso(date), label: i === 0 ? 'Today' : weekdayName(date) };
  });

  private readonly queryParams = toSignal(this.route.queryParamMap, { requireSync: true });

  protected readonly selectedDate = computed(() => {
    const raw = this.queryParams().get('date');
    return parseIso(raw) && raw! >= this.todayIso ? raw! : this.todayIso;
  });

  protected readonly dateControl = new FormControl<Date | null>(null);

  protected readonly status = signal<'loading' | 'error' | 'loaded'>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);
  private request?: Subscription;

  protected readonly cards = computed(() => {
    const date = this.selectedDate();
    const onDay = this.screenings().filter((s) => s.date === date);
    return this.movies()
      .map((movie) => ({
        movie,
        screenings: onDay.filter((s) => s.movieId === movie.id).sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  constructor() {
    effect(() => {
      const date = this.selectedDate();
      const inRow = this.days.some((d) => d.iso === date);
      this.dateControl.setValue(inRow ? null : parseIso(date), { emitEvent: false });
    });
    this.destroyRef.onDestroy(() => this.request?.unsubscribe());
    this.load();
  }

  protected load() {
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

  protected selectDay(iso: string) {
    this.router.navigate(['/'], { queryParams: { date: iso } });
  }

  protected pickDate(event: MatDatepickerInputEvent<Date>) {
    const date = event.value;
    if (!date || toIso(date) < this.todayIso) {
      this.dateControl.setValue(parseIso(this.selectedDate()), { emitEvent: false });
      return;
    }
    this.selectDay(toIso(date));
  }

  protected openSeats(screeningId: number) {
    this.router.navigate(['/screenings', screeningId, 'seats']);
  }
}
