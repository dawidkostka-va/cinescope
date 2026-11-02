import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { addDays, parseIsoDate, today, toIsoDate, weekdayName } from '../core/dates';
import { Movie, Screening } from '../core/models';

type LoadState = 'loading' | 'error' | 'loaded';

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieListComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly queryParams = toSignal(inject(ActivatedRoute).queryParamMap);

  protected readonly minDate = today();
  protected readonly days = computed(() => {
    const start = today();
    return [0, 1, 2, 3, 4].map((offset) => {
      const date = addDays(start, offset);
      return { iso: toIsoDate(date), label: offset === 0 ? 'Today' : weekdayName(date) };
    });
  });

  protected readonly selectedDate = computed(() => {
    const parsed = parseIsoDate(this.queryParams()?.get('date'));
    return parsed && parsed >= today() ? toIsoDate(parsed) : toIsoDate(today());
  });

  protected readonly pickerValue = computed(() => {
    const iso = this.selectedDate();
    return this.days().some((d) => d.iso === iso) ? null : parseIsoDate(iso);
  });

  protected readonly state = signal<LoadState>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);
  private requestId = 0;

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
    const id = ++this.requestId;
    this.state.set('loading');
    forkJoin([this.api.movies(), this.api.screenings()]).subscribe({
      next: ([movies, screenings]) => {
        if (id !== this.requestId) return;
        this.movies.set(movies);
        this.screenings.set(screenings);
        this.state.set('loaded');
      },
      error: () => {
        if (id !== this.requestId) return;
        this.state.set('error');
      },
    });
  }

  protected selectDay(iso: string): void {
    this.router.navigate([], { queryParams: { date: iso } });
  }

  protected pickDate(event: MatDatepickerInputEvent<Date>): void {
    if (event.value) this.selectDay(toIsoDate(event.value));
  }

  protected openSeats(screeningId: number): void {
    this.router.navigate(['/screenings', screeningId, 'seats']);
  }
}
