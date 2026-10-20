import { Component, computed, input } from '@angular/core';
import { buildRowSelectionLines } from '../../core/utils/seat.util';

@Component({
  selector: 'app-selected-seats-panel',
  templateUrl: './selected-seats-panel.component.html',
  styleUrl: './selected-seats-panel.component.scss',
})
export class SelectedSeatsPanelComponent {
  readonly selectedSeats = input.required<string[]>();

  readonly count = computed(() => this.selectedSeats().length);
  readonly rowLines = computed(() => buildRowSelectionLines(this.selectedSeats()));
}
