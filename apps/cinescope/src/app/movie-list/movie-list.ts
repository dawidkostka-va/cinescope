import { Component, computed, inject, resource } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../api.service';
import { addDays, parseIsoDate, startOfToday, toIsoDate, weekdayName } from '../dates';

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly query = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: true });

  protected readonly today = startOfToday();
  private readonly todayIso = toIsoDate(this.today);

  protected readonly selectedDate = computed(() => {
    const parsed = parseIsoDate(this.query().get('date'));
    return parsed && toIsoDate(parsed) >= this.todayIso ? toIsoDate(parsed) : this.todayIso;
  });

  protected readonly days = computed(() =>
    Array.from({ length: 5 }, (_, index) => {
      const date = addDays(this.today, index);
      const iso = toIsoDate(date);
      return {
        iso,
        label: index === 0 ? 'Today' : weekdayName(date),
        selected: iso === this.selectedDate(),
      };
    }),
  );

  protected readonly pickerValue = computed(() =>
    this.days().some((day) => day.selected) ? null : parseIsoDate(this.selectedDate()),
  );

  private readonly listing = resource({
    params: () => this.selectedDate(),
    loader: async ({ params: date }) => {
      const [movies, screenings] = await Promise.all([
        firstValueFrom(this.api.movies()),
        firstValueFrom(this.api.screeningsOn(date)),
      ]);
      return { movies, screenings };
    },
  });

  protected readonly isLoading = computed(() => this.listing.isLoading());
  protected readonly hasError = computed(() => !!this.listing.error());

  protected readonly cards = computed(() => {
    const data = this.listing.value();
    if (!data) {
      return [];
    }
    return data.movies
      .map((movie) => ({
        movie,
        screenings: data.screenings
          .filter((screening) => screening.movieId === movie.id)
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  });

  protected selectDay(iso: string): void {
    this.router.navigate(['/'], { queryParams: { date: iso } });
  }

  protected pickDate(date: Date | null): void {
    if (!date || toIsoDate(date) < this.todayIso) {
      return;
    }
    this.selectDay(toIsoDate(date));
  }

  protected openScreening(id: number): void {
    this.router.navigate(['/screenings', id, 'seats']);
  }

  protected retry(): void {
    this.listing.reload();
  }
}
