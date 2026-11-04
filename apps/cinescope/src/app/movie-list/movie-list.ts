import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { httpResource } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { API_URL } from '../api';
import { addDays, parseIsoDate, startOfToday, toIsoDate, weekdayName } from '../date';
import { Movie, Screening } from '../models';

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly today = startOfToday();
  private readonly todayIso = toIsoDate(this.today);
  protected readonly dayButtons = Array.from({ length: 5 }, (_, index) => {
    const day = addDays(this.today, index);
    return { iso: toIsoDate(day), label: index === 0 ? 'Today' : weekdayName(day) };
  });

  private readonly queryParams = toSignal(this.route.queryParamMap, { requireSync: true });
  protected readonly selectedDate = computed(() => {
    const date = parseIsoDate(this.queryParams().get('date'));
    return date && date >= this.today ? toIsoDate(date) : this.todayIso;
  });
  protected readonly pickedDate = computed(() => {
    const iso = this.selectedDate();
    return this.dayButtons.some((button) => button.iso === iso) ? null : parseIsoDate(iso);
  });

  private readonly moviesResource = httpResource<Movie[]>(() => `${API_URL}/movies`);
  private readonly screeningsResource = httpResource<Screening[]>(() => ({
    url: `${API_URL}/screenings`,
    params: { date: this.selectedDate() },
  }));

  protected readonly isLoading = computed(
    () => this.moviesResource.isLoading() || this.screeningsResource.isLoading(),
  );
  protected readonly hasError = computed(
    () => !!this.moviesResource.error() || !!this.screeningsResource.error(),
  );
  protected readonly cards = computed(() => {
    const movies = this.moviesResource.value() ?? [];
    const screenings = this.screeningsResource.value() ?? [];
    return movies
      .map((movie) => ({
        movie,
        screenings: screenings
          .filter((screening) => screening.movieId === movie.id)
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });
  protected readonly isEmpty = computed(
    () => !this.isLoading() && !this.hasError() && this.cards().length === 0,
  );

  protected readonly minDate = this.today;

  protected selectDate(iso: string): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { date: iso } });
  }

  protected onDatePicked(date: Date | null): void {
    if (date && date >= this.today) {
      this.selectDate(toIsoDate(date));
    }
  }

  protected retry(): void {
    this.moviesResource.reload();
    this.screeningsResource.reload();
  }

  protected openScreening(id: number): void {
    this.router.navigateByUrl(`/screenings/${id}/seats`);
  }
}
