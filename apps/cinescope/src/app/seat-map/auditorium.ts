export interface SeatCell {
  kind: 'seat';
  key: string;
  row: number;
  column: number;
  id: string;
  accessible: boolean;
  occupied: boolean;
}

export interface CouchCell {
  kind: 'couch';
  key: string;
  row: number;
  start: number;
  end: number;
  ids: [string, string];
  occupied: boolean;
}

export type Cell = SeatCell | CouchCell;

export type Segment = { kind: 'block'; side: boolean; cells: Cell[] } | { kind: 'aisle' };

export interface AuditoriumRow {
  row: number;
  segments: Segment[];
}

const ROW_COUNT = 15;
const COUCH_ROW = 15;
const ENTRANCE_LAST_ROW = 10;

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function seatsIn(cell: Cell): number {
  return cell.kind === 'seat' ? 1 : 2;
}

export function buildAuditorium(occupied: ReadonlySet<string>): AuditoriumRow[] {
  return Array.from({ length: ROW_COUNT }, (_, index) => {
    const row = index + 1;
    return {
      row,
      segments: [
        {
          kind: 'block',
          side: true,
          cells: row <= ENTRANCE_LAST_ROW ? [] : cellsBetween(row, 1, 4, occupied),
        },
        { kind: 'aisle' },
        { kind: 'block', side: false, cells: cellsBetween(row, 5, 20, occupied) },
        { kind: 'aisle' },
        { kind: 'block', side: true, cells: cellsBetween(row, 21, 24, occupied) },
      ],
    };
  });
}

function cellsBetween(
  row: number,
  first: number,
  last: number,
  occupied: ReadonlySet<string>,
): Cell[] {
  const cells: Cell[] = [];
  if (row === COUCH_ROW) {
    for (let start = first; start <= last; start += 2) {
      const ids: [string, string] = [seatId(row, start), seatId(row, start + 1)];
      cells.push({
        kind: 'couch',
        key: `${ids[0]}-${ids[1]}`,
        row,
        start,
        end: start + 1,
        ids,
        occupied: ids.some((id) => occupied.has(id)),
      });
    }
    return cells;
  }
  for (let column = first; column <= last; column++) {
    const id = seatId(row, column);
    cells.push({
      kind: 'seat',
      key: id,
      row,
      column,
      id,
      accessible: row === 1 && column >= 10 && column <= 15,
      occupied: occupied.has(id),
    });
  }
  return cells;
}
