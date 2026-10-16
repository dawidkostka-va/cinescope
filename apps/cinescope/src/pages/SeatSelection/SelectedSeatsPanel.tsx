import { groupSeatsByRow } from '../../booking/ticketItems';

interface SelectedSeatsPanelProps {
  selectedSeats: Set<string>;
}

export function SelectedSeatsPanel({ selectedSeats }: SelectedSeatsPanelProps) {
  const rows = groupSeatsByRow([...selectedSeats]);

  return (
    <div className="selected-seats" data-testid="selected-seats">
      <div data-testid="selected-seats-count">Selected seats: {selectedSeats.size}</div>
      {rows.map(({ row, label }) => (
        <div key={row} data-testid="selected-seats-row" data-row={row}>
          Row {row}: {label}
        </div>
      ))}
    </div>
  );
}
