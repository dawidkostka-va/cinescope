import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { describeSeat, formatPrice, priceOf, Selection, sortSelections } from '../auditorium';
import { BookingService } from '../booking.service';
import { ScreeningView } from '../models';

@Component({
  selector: 'app-summary',
  imports: [MatButtonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  readonly view = input.required<ScreeningView>();

  private readonly booking = inject(BookingService);
  private readonly router = inject(Router);

  protected readonly items = computed(() => {
    const { screening, movie } = this.view();
    return sortSelections(this.booking.current()?.selections ?? []).map((selection) => ({
      key: `${selection.row}-${selection.column}`,
      selection,
      title: movie.title,
      datetime: `${screening.date} ${screening.time}`,
      row: selection.row,
      seat: describeSeat(selection),
      price: formatPrice(priceOf(selection)),
    }));
  });

  protected readonly totalText = computed(() => {
    const total = this.booking
      .current()
      ?.selections.reduce((sum, selection) => sum + priceOf(selection), 0) ?? 0;
    return `Total: ${formatPrice(total)}`;
  });

  protected remove(selection: Selection): void {
    this.booking.removeSelection(selection);
    if (!this.booking.current()?.selections.length) {
      this.router.navigate(['/screenings', this.view().screening.id, 'seats']);
    }
  }

  protected back(): void {
    this.router.navigate(['/screenings', this.view().screening.id, 'seats']);
  }

  protected confirm(): void {
    this.router.navigate(['/screenings', this.view().screening.id, 'checkout']);
  }
}
