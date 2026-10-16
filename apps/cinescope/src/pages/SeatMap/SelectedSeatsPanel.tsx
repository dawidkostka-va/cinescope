import { useMemo } from 'react';
import Box from '@mui/material/Box';
import { getSelectionItems } from '../../utils/auditorium';

interface SelectedSeatsPanelProps {
  seats: readonly string[];
}

export function SelectedSeatsPanel({ seats }: SelectedSeatsPanelProps) {
  const rows = useMemo(() => {
    const items = getSelectionItems(seats);
    const byRow = new Map<number, string[]>();
    for (const item of items) {
      const label = item.type === 'seat' ? String(item.column) : `${item.columnStart}-${item.columnEnd}`;
      const labels = byRow.get(item.row) ?? [];
      labels.push(label);
      byRow.set(item.row, labels);
    }
    return [...byRow.entries()]
      .sort(([rowA], [rowB]) => rowA - rowB)
      .map(([row, labels]) => ({ row, labels: labels.join(', ') }));
  }, [seats]);

  return (
    <Box data-testid="selected-seats" sx={{ my: 2 }}>
      <div data-testid="selected-seats-count">{`Selected seats: ${seats.length}`}</div>
      {rows.map(({ row, labels }) => (
        <div key={row} data-testid="selected-seats-row" data-row={row}>
          {`Row ${row}: ${labels}`}
        </div>
      ))}
    </Box>
  );
}
