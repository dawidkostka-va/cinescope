export type SeatSlot = { kind: 'seat'; column: number } | { kind: 'couch'; columnStart: number; columnEnd: number };

export const ROWS = 15;
export const COUCH_ROW = 15;
export const AISLE_TRACK_A = 6;
export const AISLE_TRACK_B = 23;
export const LABEL_TRACK_LEFT = 1;
export const LABEL_TRACK_RIGHT = 28;

/** The static geometry of one row: its seats or couches, left to right. */
export function slotsForRow(row: number): SeatSlot[] {
  if (row === COUCH_ROW) {
    const slots: SeatSlot[] = [];
    for (let c = 1; c <= 23; c += 2) slots.push({ kind: 'couch', columnStart: c, columnEnd: c + 1 });
    return slots;
  }
  const first = row >= 11 && row <= 14 ? 1 : 5;
  const slots: SeatSlot[] = [];
  for (let c = first; c <= 24; c++) slots.push({ kind: 'seat', column: c });
  return slots;
}

/** Maps a global column number (1-24) to its CSS grid track, accounting for the two aisles. */
export function columnTrack(column: number): number {
  if (column <= 4) return column + 1;
  if (column <= 20) return column + 2;
  return column + 3;
}
