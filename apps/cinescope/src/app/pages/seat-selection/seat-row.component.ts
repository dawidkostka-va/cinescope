import { Component, input, output } from '@angular/core';
import { AuditoriumCell, AuditoriumRow } from '../../shared/auditorium';
import { seatId } from '../../shared/seat-utils';

@Component({
  selector: 'app-seat-row',
  templateUrl: './seat-row.component.html',
  styleUrl: './seat-row.component.scss',
})
export class SeatRowComponent {
  readonly row = input.required<AuditoriumRow>();
  readonly seatToggle = output<string[]>();

  protected cellKey(cell: AuditoriumCell): string {
    return cell.kind === 'seat' ? `seat-${cell.column}` : `couch-${cell.columnStart}`;
  }

  protected onCellClick(cell: AuditoriumCell): void {
    if (cell.state === 'unavailable') {
      return;
    }
    const ids = cell.kind === 'seat' ? [seatId(cell.row, cell.column)] : [seatId(cell.row, cell.columnStart), seatId(cell.row, cell.columnEnd)];
    this.seatToggle.emit(ids);
  }
}
