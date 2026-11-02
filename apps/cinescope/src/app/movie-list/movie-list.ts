import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../api.service';
import { parseIso, toIso, weekday } from '../dates';
import { Movie, Screening } from '../models';

type LoadState = 'loading' | 'error' | 'loaded';

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly today = (() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  })();
  private readonly todayIso = toIso(this.today);

  protected readonly days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate() + i);
    return { iso: toIso(d), label: i === 0 ? 'Today' : weekday(d) };
  });

  private readonly query = toSignal(this.route.queryParamMap, { requireSync: true });

  protected readonly selected = computed(() => {
    const iso = this.query().get('date');
    return iso && parseIso(iso) && iso >= this.todayIso ? iso : this.todayIso;
  });

  protected readonly pickerValue = computed(() =>
    this.days.some((d) => d.iso === this.selected()) ? null : parseIso(this.selected()),
  );

  protected readonly state = signal<LoadState>('loading');
  private readonly movies = signal<Movie[]>([]);
  private readonly screenings = signal<Screening[]>([]);

  protected readonly cards = computed(() => {
    const day = this.selected();
    const onDay = this.screenings().filter((s) => s.date === day);
    return this.movies()
      .map((movie) => ({
        movie,
        screenings: onDay.filter((s) => s.movieId === movie.id).sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((c) => c.screenings.length > 0);
  });

  constructor() {
    this.load();
  }

  protected load() {
    this.state.set('loading');
    this.api.moviesAndScreenings().subscribe({
      next: ({ movies, screenings }) => {
        this.movies.set(movies);
        this.screenings.set(screenings);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }

  protected selectDay(iso: string) {
    this.router.navigate([], { relativeTo: this.route, queryParams: { date: iso } });
  }

  protected onDate(e: MatDatepickerInputEvent<Date>) {
    if (e.value) this.selectDay(toIso(e.value));
  }

  protected open(screeningId: number) {
    this.router.navigate(['/screenings', screeningId, 'seats']);
  }
}

