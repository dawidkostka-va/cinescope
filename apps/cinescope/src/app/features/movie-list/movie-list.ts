import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { addDays, parseIsoDate, resolveSelectedDate, todayDate, toIsoDate, weekdayName } from '../../core/date.util';
import { Movie, Screening } from '../../core/models';

interface DayButton {
  label: string;
  date: string;
}

interface MovieCardData {
  movie: Movie;
  screenings: Screening[];
}

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule],
  templateUrl: './movie-list.html',
  styleUrl: './movie-list.scss',
})
export class MovieList {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly selectedDate = signal(resolveSelectedDate(null));
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly cards = signal<MovieCardData[]>([]);

  readonly dayButtons = computed<DayButton[]>(() => {
    const today = todayDate();
    const buttons: DayButton[] = [{ label: 'Today', date: toIsoDate(today) }];
    for (let i = 1; i <= 4; i++) {
      const date = addDays(today, i);
      buttons.push({ label: weekdayName(date), date: toIsoDate(date) });
    }
    return buttons;
  });

  readonly datepickerValue = computed(() => parseIsoDate(this.selectedDate()) ?? todayDate());
  readonly minDate = todayDate();

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const resolved = resolveSelectedDate(params.get('date'));
      this.selectedDate.set(resolved);
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    const date = this.selectedDate();
    forkJoin({
      movies: this.api.getMovies(),
      screenings: this.api.getScreenings(date),
    }).subscribe({
      next: ({ movies, screenings }) => {
        const byMovie = new Map<number, Screening[]>();
        for (const screening of screenings) {
          const group = byMovie.get(screening.movieId) ?? [];
          group.push(screening);
          byMovie.set(screening.movieId, group);
        }
        const cards: MovieCardData[] = [];
        for (const movie of movies) {
          const movieScreenings = byMovie.get(movie.id);
          if (movieScreenings && movieScreenings.length > 0) {
            cards.push({ movie, screenings: [...movieScreenings].sort((a, b) => a.time.localeCompare(b.time)) });
          }
        }
        this.cards.set(cards);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  selectDate(date: string): void {
    this.router.navigate(['/'], { queryParams: { date } });
  }

  onDatepickerChange(date: Date | null): void {
    if (date) {
      this.selectDate(toIsoDate(date));
    }
  }

  openScreening(screening: Screening): void {
    this.router.navigate(['/screenings', screening.id, 'seats']);
  }
}
