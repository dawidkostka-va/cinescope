import { Component, computed, inject, resource } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Cell, cellIds, compareCells } from '../core/auditorium';
import { BookingService } from '../core/booking.service';
import { formatPrice, priceOf } from '../core/pricing';


function seatDescription(cell: Cell): string {
  return cell.kind === 'seat' ? `${cell.column}` : `Couch ${cell.start}-${cell.end}`;
}

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
})
export class SummaryComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, { requireSync: true });
  private readonly booking = inject(BookingService);

  readonly data = resource({
    params: () => Number(this.params().get('id')),
    loader: async ({ params: id }) => {
      try {
        const screening = await firstValueFrom(this.api.screening(id));
        const movie = await firstValueFrom(this.api.movie(screening.movieId));
        return { screening, movie };
      } catch {
        await this.router.navigate(['/']);
        return undefined;
      }
    },
  });

  readonly items = computed(() =>
    [...this.booking.seats()].sort(compareCells).map((cell) => ({
      key: cellIds(cell).join(),
      cell,
      row: cell.row,
      seat: seatDescription(cell),
      price: formatPrice(priceOf(cell)),
    })),
  );

  readonly totalText = computed(() => `Total: ${formatPrice(this.booking.total())}`);

  remove(cell: Cell): void {
    this.booking.toggle(cell);
    if (this.booking.seatCount() === 0) {
      this.back();
    }
  }

  back(): void {
    this.router.navigate(['/screenings', this.params().get('id'), 'seats']);
  }

  confirm(): void {
    this.router.navigate(['/screenings', this.params().get('id'), 'checkout']);
  }
}
