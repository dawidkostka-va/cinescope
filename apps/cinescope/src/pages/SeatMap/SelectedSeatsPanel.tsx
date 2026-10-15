import { selectedSeatsByRow } from '../../domain/bookingItems';

interface SelectedSeatsPanelProps {
  seats: string[];
}

export function SelectedSeatsPanel({ seats }: SelectedSeatsPanelProps) {
  const rows = selectedSeatsByRow(seats);

  return (
    <div data-testid="selected-seats" className="selected-seats">
      <div data-testid="selected-seats-count">Selected seats: {seats.length}</div>
      {rows.map((row) => (
        <div key={row.row} data-testid="selected-seats-row" data-row={row.row}>
          Row {row.row}: {row.label}
        </div>
      ))}
    </div>
  );
}
