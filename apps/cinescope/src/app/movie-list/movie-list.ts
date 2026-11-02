import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { addDays, parseIso, startOfToday, toIso, weekdayName } from '../core/dates';
import { Movie, Screening } from '../core/models';

type LoadState = 'loading' | 'error' | 'loaded';

@Component({
  selector: 'app-movie-list',
  imports: [MatButton, MatDatepickerModule, MatFormField, MatInput, MatLabel],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly query = toSignal(inject(ActivatedRoute).queryParamMap);

  protected readonly today = startOfToday();
  private readonly todayIso = toIso(this.today);

  protected readonly days = Array.from({ length: 5 }, (_, i) => {
    const date = addDays(this.today, i);
    return { iso: toIso(date), label: i === 0 ? 'Today' : weekdayName(date) };
  });

  protected readonly selected = computed(() => {
    const raw = this.query()?.get('date');
    return raw && parseIso(raw) && raw >= this.todayIso ? raw : this.todayIso;
  });

  protected readonly pickerValue = computed(() => {
    const iso = this.selected();
    return this.days.some((d) => d.iso === iso) ? null : parseIso(iso);
  });

  protected readonly state = signal<LoadState>('loading');
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

  protected selectDay(iso: string): void {
    this.router.navigate([], { queryParams: { date: iso } });
  }

  protected pick(date: Date | null): void {
    if (date && !isNaN(date.getTime()) && date >= this.today) this.selectDay(toIso(date));
  }

  protected open(screening: Screening): void {
    this.router.navigate(['/screenings', screening.id, 'seats']);
  }
}
