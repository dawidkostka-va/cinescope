import { Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { catchError, EMPTY, map, startWith, switchMap } from 'rxjs';
import { Cell, cellsForIds, sortByPosition } from '../auditorium';
import { readBooking, writeBooking } from '../booking';
import { CinemaApi } from '../cinema-api';
import { Movie, Screening } from '../models';
import { formatPrice, priceOf } from '../pricing';

type SummaryState =
  | { status: 'loading' }
  | { status: 'ready'; screening: Screening; movie: Movie };

function describe(cell: Cell): string {
  return cell.kind === 'couch' ? `Couch ${cell.start}-${cell.end}` : String(cell.column);
}

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private readonly api = inject(CinemaApi);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  protected readonly items = signal<Cell[]>(cellsForIds(readBooking()?.itemIds ?? []));

  protected readonly lines = computed(() =>
    sortByPosition(this.items()).map((cell) => ({
      id: cell.id,
      row: cell.row,
      seat: describe(cell),
      price: formatPrice(priceOf(cell)),
    })),
  );

  protected readonly totalLabel = computed(
    () => `Total: ${formatPrice(this.items().reduce((total, cell) => total + priceOf(cell), 0))}`,
  );

  protected readonly state = toSignal(
    toObservable(this.id).pipe(
      switchMap((id) =>
        this.api.getScreeningDetails(Number(id)).pipe(
          map((details): SummaryState => ({ status: 'ready', ...details })),
          startWith<SummaryState>({ status: 'loading' }),
          catchError(() => {
            void this.router.navigateByUrl('/');
            return EMPTY;
          }),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } as SummaryState },
  );

  protected readonly details = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state : null;
  });

  protected remove(id: string): void {
    const remaining = this.items().filter((cell) => cell.id !== id);
    this.items.set(remaining);
    const booking = readBooking();
    if (booking) {
      writeBooking({ ...booking, itemIds: remaining.map((cell) => cell.id) });
    }
    if (remaining.length === 0) {
      void this.router.navigate(['/screenings', this.id(), 'seats']);
    }
  }

  protected back(): void {
    void this.router.navigate(['/screenings', this.id(), 'seats']);
  }

  protected confirm(): void {
    void this.router.navigate(['/screenings', this.id(), 'checkout']);
  }
}
