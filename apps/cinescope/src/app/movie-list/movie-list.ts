import { Component, DestroyRef, effect, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { addDays, parseIsoDate, startOfDay, toIsoDate, weekdayName } from '../core/dates';
import { Movie, Screening } from '../core/models';

interface DayOption {
  iso: string;
  label: string;
}

@Component({
  selector: 'app-movie-list',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly queryParams = toSignal(inject(ActivatedRoute).queryParamMap, {
    requireSync: true,
  });

  protected readonly today = startOfDay(new Date());
  private readonly todayIso = toIsoDate(this.today);

  protected readonly days: DayOption[] = [0, 1, 2, 3, 4].map((offset) => {
    const date = addDays(this.today, offset);
    return { iso: toIsoDate(date), label: offset === 0 ? 'Today' : weekdayName(date) };
  });

  protected readonly selectedIso = computed(() => {
    const iso = this.queryParams().get('date');
    return iso && parseIsoDate(iso) && iso >= this.todayIso ? iso : this.todayIso;
  });

  protected readonly pickerControl = new FormControl<Date | null>(null);

  protected readonly status = signal<'loading' | 'error' | 'loaded'>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);

  protected readonly cards = computed(() => {
    const iso = this.selectedIso();
    return this.movies()
      .map((movie) => ({
        movie,
        screenings: this.screenings()
          .filter((s) => s.movieId === movie.id && s.date === iso)
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  private request: Subscription | undefined;

  constructor() {
    effect(() => {
      const iso = this.selectedIso();
      const inRow = this.days.some((day) => day.iso === iso);
      this.pickerControl.setValue(inRow ? null : parseIsoDate(iso), { emitEvent: false });
    });
    this.destroyRef.onDestroy(() => this.request?.unsubscribe());
    this.load();
  }

  protected load(): void {
    this.request?.unsubscribe();
    this.status.set('loading');
    this.request = forkJoin([this.api.getMovies(), this.api.getScreenings()]).subscribe({
      next: ([movies, screenings]) => {
        this.movies.set(movies);
        this.screenings.set(screenings);
        this.status.set('loaded');
      },
      error: () => this.status.set('error'),
    });
  }

  protected selectDay(iso: string): void {
    this.router.navigate([], { queryParams: { date: iso } });
  }

  protected onPick(event: MatDatepickerInputEvent<Date>): void {
    if (event.value) {
      this.selectDay(toIsoDate(event.value));
    }
  }

  protected openSeats(screeningId: number): void {
    this.router.navigate(['/screenings', screeningId, 'seats']);
  }
}
