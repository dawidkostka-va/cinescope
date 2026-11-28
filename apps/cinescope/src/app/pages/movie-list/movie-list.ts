import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Movie, Screening } from '../../core/models';
import { parseIsoDate, toIsoDate, weekdayName } from '../../core/seating';

interface Day {
  date: string;
  label: string;
}

@Component({
  selector: 'app-movie-list',
  imports: [ReactiveFormsModule, MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly query = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  protected readonly today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  private readonly todayIso = toIsoDate(this.today);

  protected readonly days: Day[] = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate() + i);
    return { date: toIsoDate(date), label: i === 0 ? 'Today' : weekdayName(date) };
  });

  protected readonly selectedDate = computed(() => {
    const value = this.query().get('date');
    return value && parseIsoDate(value) && value >= this.todayIso ? value : this.todayIso;
  });

  protected readonly pickerControl = new FormControl<Date | null>(null);

  protected readonly status = signal<'loading' | 'error' | 'loaded'>('loading');
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
    effect(() => {
      const date = this.selectedDate();
      const inRow = this.days.some((day) => day.date === date);
      this.pickerControl.setValue(inRow ? null : parseIsoDate(date), { emitEvent: false });
    });
    void this.load();
  }

  protected async load(): Promise<void> {
    this.status.set('loading');
    try {
      const [movies, screenings] = await Promise.all([this.api.getMovies(), this.api.getScreenings()]);
      this.movies.set(movies);
      this.screenings.set(screenings);
      this.status.set('loaded');
    } catch {
      this.status.set('error');
    }
  }

  protected selectDay(date: string): void {
    if (date === this.selectedDate() && this.query().get('date') === date) return;
    void this.router.navigate([], { queryParams: { date } });
  }

  protected pickDate(event: MatDatepickerInputEvent<Date>): void {
    const value = event.value;
    if (!value || isNaN(value.getTime())) return;
    const iso = toIsoDate(value);
    if (iso < this.todayIso) return;
    this.selectDay(iso);
  }

  protected openScreening(id: number): void {
    void this.router.navigate(['/screenings', id, 'seats']);
  }
}
