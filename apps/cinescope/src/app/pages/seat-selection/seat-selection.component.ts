import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { BookingService } from '../../core/booking.service';
import { ToastService } from '../../core/toast.service';
import { Screening } from '../../core/models';
import { buildAuditorium } from '../../shared/auditorium';
import { showDate } from '../../shared/date-utils';
import { buildSelectedRowLines } from '../../shared/grouping';
import { SeatRowComponent } from './seat-row.component';

@Component({
  selector: 'app-seat-selection',
  imports: [MatButtonModule, SeatRowComponent],
  templateUrl: './seat-selection.component.html',
  styleUrl: './seat-selection.component.scss',
})
export class SeatSelectionComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly bookingService = inject(BookingService);
  private readonly toast = inject(ToastService);

  protected readonly screening = signal<Screening | null>(null);

  protected readonly subtitle = computed(() => {
    const screening = this.screening();
    return screening ? `Show Date: ${showDate(screening.date, screening.time)}` : '';
  });

  protected readonly selectedIds = computed(() => this.bookingService.booking()?.seats ?? []);
  protected readonly selectedCount = computed(() => this.selectedIds().length);
  protected readonly selectedRowLines = computed(() => buildSelectedRowLines(this.selectedIds()));

  protected readonly rows = computed(() => {
    const screening = this.screening();
    if (!screening) {
      return [];
    }
    return buildAuditorium(new Set(screening.occupiedSeats), new Set(this.selectedIds()));
  });

  protected readonly legendItems: Array<{ state: string; label: string }> = [
    { state: 'available', label: 'Available' },
    { state: 'selected', label: 'Selected' },
    { state: 'unavailable', label: 'Unavailable' },
    { state: 'accessible', label: 'Accessible' },
  ];

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = Number(params.get('id'));
      this.loadScreening(id);
    });
  }

  private loadScreening(id: number): void {
    this.api.getScreening(id).subscribe({
      next: (screening) => {
        this.screening.set(screening);
        this.bookingService.ensureBookingFor(screening.id);
      },
      error: () => this.router.navigateByUrl('/'),
    });
  }

  protected onToggle(ids: string[]): void {
    const result = this.bookingService.toggleSeats(ids);
    if (result === 'limit') {
      this.toast.show('Maximum 10 seats per booking');
    }
  }

  protected cancel(): void {
    this.bookingService.clear();
    this.router.navigateByUrl('/');
  }

  protected continueToSummary(): void {
    const screening = this.screening();
    if (!screening || this.selectedCount() === 0) {
      return;
    }
    this.router.navigate(['/screenings', screening.id, 'summary']);
  }
}
