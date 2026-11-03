import { Component, computed, inject, resource } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Movie, Screening } from '../core/models';
import { addDays, parseIsoDate, startOfToday, toIsoDate, weekdayName } from '../core/dates';

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.component.html',
  styleUrl: './movie-list.component.scss',
})
export class MovieListComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly today = startOfToday();
  readonly days = Array.from({ length: 5 }, (_, index) => {
    const date = addDays(this.today, index);
    return { iso: toIsoDate(date), label: index === 0 ? 'Today' : weekdayName(date) };
  });

  private readonly query = toSignal(this.route.queryParamMap, { requireSync: true });

  readonly selectedIso = computed(() => {
    const parsed = parseIsoDate(this.query().get('date') ?? '');
    return parsed && parsed >= this.today ? toIsoDate(parsed) : toIsoDate(this.today);
  });

  readonly pickerValue = computed(() => {
    const iso = this.selectedIso();
    return this.days.some((day) => day.iso === iso) ? null : parseIsoDate(iso);
  });

  readonly data = resource({
    params: () => this.selectedIso(),
    loader: async ({ params: date }) => {
      const [movies, screenings] = await Promise.all([
        firstValueFrom(this.api.movies()),
        firstValueFrom(this.api.screeningsOn(date)),
      ]);
      return { movies, screenings };
    },
  });

  readonly cards = computed(() => {
    const value = this.data.value();
    if (!value) {
      return [];
    }
    return value.movies
      .map((movie: Movie) => ({
        movie,
        screenings: value.screenings
          .filter((screening: Screening) => screening.movieId === movie.id)
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  selectDay(iso: string): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { date: iso } });
  }

  onDatePicked(date: Date | null): void {
    if (date && date >= this.today) {
      this.selectDay(toIsoDate(date));
    }
  }

  openScreening(id: number): void {
    this.router.navigate(['/screenings', id, 'seats']);
  }
}
