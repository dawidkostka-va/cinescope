import { groupSeatIds, SelectionItem } from '../../utils/seats';

function formatRowItems(items: SelectionItem[]): string {
  return items.map((item) => (item.kind === 'seat' ? String(item.column) : `${item.columnStart}-${item.columnEnd}`)).join(', ');
}

export function SelectedSeatsPanel({ seatIds }: { seatIds: string[] }) {
  const items = groupSeatIds(seatIds);
  const rows = new Map<number, SelectionItem[]>();
  for (const item of items) {
    const list = rows.get(item.row) ?? [];
    list.push(item);
    rows.set(item.row, list);
  }

  return (
    <div className="selected-seats" data-testid="selected-seats">
      <div data-testid="selected-seats-count">Selected seats: {seatIds.length}</div>
      {[...rows.entries()].map(([row, rowItems]) => (
        <div key={row} data-testid="selected-seats-row" data-row={row}>
          Row {row}: {formatRowItems(rowItems)}
        </div>
      ))}
    </div>
  );
}

export default SelectedSeatsPanel;
