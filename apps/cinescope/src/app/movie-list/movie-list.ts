import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerInput, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Api } from '../core/api';
import { parseIsoDate, toIsoDate, weekdayName } from '../core/dates';
import { Movie, Screening } from '../core/models';

interface Day {
  date: string;
  label: string;
}

type LoadState = 'loading' | 'error' | 'loaded';

@Component({
  selector: 'app-movie-list',
  imports: [FormsModule, MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly datepickerInput = viewChild(MatDatepickerInput);

  protected readonly todayDate = (() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  })();
  private readonly todayIso = toIsoDate(this.todayDate);

  protected readonly days: Day[] = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(this.todayDate.getFullYear(), this.todayDate.getMonth(), this.todayDate.getDate() + i);
    return { date: toIsoDate(date), label: i === 0 ? 'Today' : weekdayName(date) };
  });

  private readonly query = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  protected readonly selectedDate = computed(() => {
    const raw = this.query().get('date');
    if (raw && parseIsoDate(raw) && raw >= this.todayIso) {
      return raw;
    }
    return this.todayIso;
  });

  protected readonly pickerValue = computed(() => {
    const selected = this.selectedDate();
    return this.days.some((d) => d.date === selected) ? null : parseIsoDate(selected);
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
        screenings: onDay.filter((s) => s.movieId === movie.id).sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    forkJoin([this.api.movies(), this.api.screenings()]).subscribe({
      next: ([movies, screenings]) => {
        this.movies.set(movies);
        this.screenings.set(screenings);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }

  protected selectDay(date: string): void {
    this.router.navigate([], { queryParams: { date }, queryParamsHandling: 'merge' });
  }

  protected pickDate(value: Date | null): void {
    if (!value) {
      return;
    }
    const iso = toIsoDate(value);
    const input = this.datepickerInput();
    if (iso < this.todayIso) {
      if (input) {
        input.value = this.pickerValue();
      }
      return;
    }
    this.selectDay(iso);
    if (input && this.days.some((d) => d.date === iso)) {
      input.value = null;
    }
  }

  protected openScreening(id: number): void {
    this.router.navigate(['/screenings', id, 'seats']);
  }
}
