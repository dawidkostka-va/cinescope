import { Component, computed, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerInput, MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { Api } from '../api';
import { Movie, Screening } from '../models';
import { parseIso, toIso, weekdayName } from '../seat-utils';

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private api = inject(Api);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  private now = new Date();
  protected today = new Date(this.now.getFullYear(), this.now.getMonth(), this.now.getDate());
  private todayIso = toIso(this.today);

  protected status = signal<'loading' | 'error' | 'loaded'>('loading');
  private movies = signal<Movie[]>([]);
  private screenings = signal<Screening[]>([]);
  private request?: Subscription;
  private picker = viewChild(MatDatepickerInput);

  private query = toSignal(this.route.queryParamMap);

  protected selected = computed(() => {
    const d = this.query()?.get('date');
    return d && parseIso(d) && d >= this.todayIso ? d : this.todayIso;
  });

  protected days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate() + i);
    return { date: toIso(d), label: i === 0 ? 'Today' : weekdayName(d) };
  });

  protected pickerValue = computed(() => {
    const s = this.selected();
    return this.days.some((d) => d.date === s) ? null : parseIso(s);
  });

  protected cards = computed(() => {
    const date = this.selected();
    const byMovie = new Map<number, Screening[]>();
    for (const s of this.screenings()) {
      if (s.date !== date) continue;
      byMovie.set(s.movieId, [...(byMovie.get(s.movieId) ?? []), s]);
    }
    return this.movies()
      .filter((m) => byMovie.has(m.id))
      .map((m) => ({ movie: m, screenings: (byMovie.get(m.id) ?? []).sort((a, b) => a.time.localeCompare(b.time)) }));
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

  protected selectDate(date: string): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { date } });
  }

  protected onPick(event: MatDatepickerInputEvent<Date>): void {
    if (!event.value) return;
    const date = toIso(event.value);
    if (this.days.some((d) => d.date === date)) {
      const input = this.picker();
      if (input) input.value = null;
    }
    this.selectDate(date);
  }

  protected openSeats(id: number): void {
    this.router.navigate(['/screenings', id, 'seats']);
  }
}
