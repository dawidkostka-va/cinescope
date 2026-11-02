import { Component, input, output } from '@angular/core';
import { AUDITORIUM, Cell, SeatCell, cellIds, cellKey, seatId } from './auditorium';

export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

@Component({
  selector: 'app-seat-map',
  templateUrl: './seat-map.html',
  styleUrl: './seat-map.scss',
})
export class SeatMap {
  readonly occupied = input.required<ReadonlySet<string>>();
  readonly selected = input.required<ReadonlySet<string>>();
  readonly cellClick = output<Cell>();

  protected readonly auditorium = AUDITORIUM;

  protected seatState(cell: SeatCell): SeatState {
    if (this.occupied().has(seatId(cell.row, cell.column))) return 'unavailable';
    if (this.selected().has(cellKey(cell))) return 'selected';
    return cell.accessible ? 'accessible' : 'available';
  }

  protected couchState(cell: Cell): SeatState {
    if (cellIds(cell).some((id) => this.occupied().has(id))) return 'unavailable';
    return this.selected().has(cellKey(cell)) ? 'selected' : 'available';
  }
}
