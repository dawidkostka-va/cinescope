import { Component, computed, input, output } from '@angular/core';
import { AUDITORIUM_LAYOUT } from '../../core/utils/auditorium-layout.util';
import { CouchCellVm, SeatCellVm } from '../../core/utils/auditorium-layout.util';
import { SeatState, couchState, seatState } from '../../core/utils/seat.util';

@Component({
  selector: 'app-auditorium',
  templateUrl: './auditorium.component.html',
  styleUrl: './auditorium.component.scss',
})
export class AuditoriumComponent {
  readonly occupiedSeats = input.required<string[]>();
  readonly selectedSeats = input.required<string[]>();
  readonly seatToggle = output<string[]>();

  readonly rows = AUDITORIUM_LAYOUT;

  private readonly occupiedSet = computed(() => new Set(this.occupiedSeats()));
  private readonly selectedSet = computed(() => new Set(this.selectedSeats()));

  seatState(cell: SeatCellVm): SeatState {
    return seatState(cell.id, this.occupiedSet(), this.selectedSet(), cell.accessible);
  }

  couchState(cell: CouchCellVm): SeatState {
    return couchState(cell.id1, cell.id2, this.occupiedSet(), this.selectedSet());
  }

  onSeatClick(cell: SeatCellVm): void {
    if (this.seatState(cell) === 'unavailable') return;
    this.seatToggle.emit([cell.id]);
  }

  onCouchClick(cell: CouchCellVm): void {
    if (this.couchState(cell) === 'unavailable') return;
    this.seatToggle.emit([cell.id1, cell.id2]);
  }
}
