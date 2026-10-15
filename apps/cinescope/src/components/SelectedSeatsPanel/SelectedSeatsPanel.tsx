import { useMemo } from 'react';
import { unitSeatDescription, unitsFromSeats } from '../../seating/units';

interface SelectedSeatsPanelProps {
  seats: string[];
}

export function SelectedSeatsPanel({ seats }: SelectedSeatsPanelProps) {
  const units = useMemo(() => unitsFromSeats(seats), [seats]);

  const rows = useMemo(() => {
    const byRow = new Map<number, string[]>();
    for (const unit of units) {
      const existing = byRow.get(unit.row);
      const description = unitSeatDescription(unit);
      if (existing) {
        existing.push(description);
      } else {
        byRow.set(unit.row, [description]);
      }
    }
    return Array.from(byRow.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([row, descriptions]) => ({ row, text: descriptions.join(', ') }));
  }, [units]);

  return (
    <div data-testid="selected-seats">
      <div data-testid="selected-seats-count">Selected seats: {seats.length}</div>
      {rows.map(({ row, text }) => (
        <div key={row} data-testid="selected-seats-row" data-row={row}>
          Row {row}: {text}
        </div>
      ))}
    </div>
  );
}
