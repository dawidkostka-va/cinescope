import { Component } from '@angular/core';
import { SEAT_COLORS, SeatState } from '../../core/seat-utils';

interface LegendItem {
  state: SeatState;
  label: string;
  color: string;
}

@Component({
  selector: 'app-legend',
  templateUrl: './legend.component.html',
  styleUrl: './legend.component.scss',
})
export class LegendComponent {
  protected readonly items: LegendItem[] = [
    { state: 'available', label: 'Available', color: SEAT_COLORS.available },
    { state: 'selected', label: 'Selected', color: SEAT_COLORS.selected },
    { state: 'unavailable', label: 'Unavailable', color: SEAT_COLORS.unavailable },
    { state: 'accessible', label: 'Accessible', color: SEAT_COLORS.accessible },
  ];
}
