import { Component, computed, inject, input, resource } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { CinemaApi } from '../cinema-api';
import { parseIsoDate, toIsoDate, WEEKDAYS } from '../dates';
import { Movie, Screening } from '../models';

interface MovieCard {
  movie: Movie;
  screenings: Screening[];
}

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);

  /** Bound from the `date` query parameter. */
  readonly date = input<string>();

  private readonly now = new Date();
  private readonly today = toIsoDate(this.now);

  protected readonly minDate = new Date(this.now.getFullYear(), this.now.getMonth(), this.now.getDate());

  protected readonly dayButtons = Array.from({ length: 5 }, (_, offset) => {
    const day = new Date(this.now.getFullYear(), this.now.getMonth(), this.now.getDate() + offset);
    return { iso: toIsoDate(day), label: offset === 0 ? 'Today' : WEEKDAYS[day.getDay()] };
  });

  /** The requested date when it is a valid ISO date and not in the past; otherwise today. */
  protected readonly selectedDate = computed(() => {
    const requested = this.date() ?? '';
    return parseIsoDate(requested) !== null && requested >= this.today ? requested : this.today;
  });

  /** The datepicker shows the selected day only when no day button represents it. */
  protected readonly pickerValue = computed(() => {
    const selected = this.selectedDate();
    return this.dayButtons.some((day) => day.iso === selected) ? null : parseIsoDate(selected);
  });

  protected readonly cards = resource({
    params: () => this.selectedDate(),
    loader: async ({ params: date }): Promise<MovieCard[]> => {
      const [movies, screenings] = await Promise.all([this.api.getMovies(), this.api.getScreeningsOn(date)]);
      return movies
        .map((movie) => ({
          movie,
          screenings: screenings
            .filter((screening) => screening.movieId === movie.id)
            .sort((a, b) => a.time.localeCompare(b.time)),
        }))
        .filter((card) => card.screenings.length > 0);
    },
  });

  protected selectDay(iso: string): void {
    if (iso < this.today) {
      return;
    }
    this.router.navigate([], { queryParams: { date: iso } });
  }

  protected onDatePicked(date: Date | null): void {
    if (date) {
      this.selectDay(toIsoDate(date));
    }
  }

  protected openScreening(id: number): void {
    this.router.navigate(['/screenings', id, 'seats']);
  }
}
