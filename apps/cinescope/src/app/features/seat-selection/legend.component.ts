import { Component } from '@angular/core';
import { SeatState } from '../../core/utils/seat.util';

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
  readonly items: LegendItem[] = [
    { state: 'available', label: 'Available', color: '#2E7D32' },
    { state: 'selected', label: 'Selected', color: '#F9A825' },
    { state: 'unavailable', label: 'Unavailable', color: '#C62828' },
    { state: 'accessible', label: 'Accessible', color: '#1565C0' },
  ];
}
