import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { addDays, parseIsoDate, startOfToday, toIsoDate, weekdayName } from '../../core/dates';
import { Movie, Screening } from '../../core/models';

interface DayButton {
  date: string;
  label: string;
}

type LoadState = 'loading' | 'error' | 'loaded';

@Component({
  selector: 'app-movie-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly today = startOfToday();
  protected readonly days: DayButton[] = Array.from({ length: 5 }, (_, i) => {
    const d = addDays(this.today, i);
    return { date: toIsoDate(d), label: i === 0 ? 'Today' : weekdayName(d) };
  });

  private readonly query = toSignal(this.route.queryParamMap, { requireSync: true });

  protected readonly selectedDate = computed(() => {
    const raw = this.query().get('date');
    const parsed = parseIsoDate(raw);
    return parsed && parsed >= this.today ? (raw as string) : this.days[0].date;
  });

  protected readonly pickerControl = new FormControl<Date | null>(null);

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
      .filter((c) => c.screenings.length > 0);
  });

  constructor() {
    effect(() => {
      const date = this.selectedDate();
      const inRow = this.days.some((d) => d.date === date);
      this.pickerControl.setValue(inRow ? null : parseIsoDate(date), { emitEvent: false });
    });
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

  protected selectDay(date: string): void {
    this.router.navigate([], { queryParams: { date } });
  }

  protected onPick(value: Date | null): void {
    if (!value || value < this.today) return;
    this.selectDay(toIsoDate(value));
  }

  protected openSeats(screening: Screening): void {
    this.router.navigate(['/screenings', screening.id, 'seats']);
  }
}
