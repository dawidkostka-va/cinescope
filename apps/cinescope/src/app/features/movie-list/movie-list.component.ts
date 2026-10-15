import { Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, catchError, combineLatest, forkJoin, map, of, startWith, switchMap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { addDays, resolveSelectedDate, toIsoDate, today, weekdayName } from '../../core/date.util';
import { MovieCardVm, buildMovieCards } from './movie-list.vm';

interface DayButtonVm {
  iso: string;
  label: string;
}

type MoviesResult = { status: 'loading' } | { status: 'error' } | { status: 'loaded'; cards: MovieCardVm[] };

@Component({
  selector: 'app-movie-list',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './movie-list.component.html',
  styleUrl: './movie-list.component.scss',
})
export class MovieListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);

  private readonly retry$ = new Subject<void>();

  readonly minDate = today();

  readonly dayButtons: DayButtonVm[] = Array.from({ length: 5 }, (_, i) => {
    const date = addDays(today(), i);
    return { iso: toIsoDate(date), label: i === 0 ? 'Today' : weekdayName(date) };
  });

  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly selectedDate = computed(() => resolveSelectedDate(this.queryParamMap().get('date')));
  readonly selectedIso = computed(() => toIsoDate(this.selectedDate()));

  private readonly result = toSignal(
    combineLatest([toObservable(this.selectedIso), this.retry$.pipe(startWith(undefined))]).pipe(
      switchMap(([date]) => this.loadMovies(date)),
    ),
    { initialValue: { status: 'loading' } as MoviesResult },
  );

  readonly isLoading = computed(() => this.result().status === 'loading');
  readonly isError = computed(() => this.result().status === 'error');
  readonly cards = computed(() => {
    const result = this.result();
    return result.status === 'loaded' ? result.cards : [];
  });
  readonly isEmpty = computed(() => this.result().status === 'loaded' && this.cards().length === 0);

  private loadMovies(date: string) {
    return forkJoin({
      movies: this.api.getMovies(),
      screenings: this.api.getScreenings(date),
    }).pipe(
      map(({ movies, screenings }) => ({ status: 'loaded', cards: buildMovieCards(movies, screenings) }) as const),
      startWith({ status: 'loading' } as const),
      catchError(() => of({ status: 'error' } as const)),
    );
  }

  isSelected(iso: string): boolean {
    return this.selectedIso() === iso;
  }

  selectDate(iso: string): void {
    this.router.navigate(['/'], { queryParams: { date: iso } });
  }

  onDatePicked(date: Date | null): void {
    if (!date) return;
    this.selectDate(toIsoDate(date));
  }

  retry(): void {
    this.retry$.next();
  }

  openScreening(screeningId: number): void {
    this.router.navigate(['/screenings', screeningId, 'seats']);
  }
}
