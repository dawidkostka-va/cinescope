import { Component, computed, effect, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, map } from 'rxjs';
import { CinemaApi } from '../cinema-api';
import { addDays, isIsoDate, isoToDate, startOfToday, toIsoDate, weekdayName } from '../dates';

@Component({
  selector: 'app-movie-list',
  imports: [MatButton, MatDatepickerModule, MatFormField, MatLabel, MatInput, MatSuffix],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly today = startOfToday();
  protected readonly todayIso = toIsoDate(this.today);
  protected readonly days = Array.from({ length: 5 }, (_, offset) => {
    const date = addDays(this.today, offset);
    return { iso: toIsoDate(date), label: offset === 0 ? 'Today' : weekdayName(date) };
  });

  private readonly dateParam = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('date'))),
    {
      requireSync: true,
    },
  );

  protected readonly selectedDate = computed(() => {
    const date = this.dateParam();
    return isIsoDate(date) && date >= this.todayIso ? date : this.todayIso;
  });

  protected readonly pickerValue = computed(() => isoToDate(this.selectedDate()));

  protected readonly data = rxResource({
    params: () => this.selectedDate(),
    stream: ({ params: date }) =>
      forkJoin({ movies: this.api.movies(), screenings: this.api.screeningsOnDate(date) }),
  });

  protected readonly cards = computed(() => {
    const value = this.data.value();
    if (!value) {
      return [];
    }
    return value.movies
      .map((movie) => ({
        movie,
        screenings: value.screenings
          .filter((screening) => screening.movieId === movie.id)
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  constructor() {
    effect(() => {
      const date = this.selectedDate();
      if (this.dateParam() !== date) {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { date },
          replaceUrl: true,
        });
      }
    });
  }

  protected selectDate(iso: string): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { date: iso } });
  }

  protected onDatePicked(event: MatDatepickerInputEvent<Date>): void {
    if (event.value) {
      const iso = toIsoDate(event.value);
      if (iso >= this.todayIso) {
        this.selectDate(iso);
      }
    }
  }

  protected openScreening(id: number): void {
    void this.router.navigate(['/screenings', id, 'seats']);
  }
}
