// Grid tracks, left to right:
// 1          label-left
// 2-5        columns 1-4
// 6-7        aisle (columns 4/5)
// 8-23       columns 5-20
// 24-25      aisle (columns 20/21)
// 26-29      columns 21-24
// 30         label-right
export const SEAT_TRACK_PX = 32;
export const LABEL_TRACK_PX = 28;

export const GRID_TEMPLATE_COLUMNS = [
  `${LABEL_TRACK_PX}px`,
  `repeat(4, ${SEAT_TRACK_PX}px)`,
  `repeat(2, ${SEAT_TRACK_PX}px)`,
  `repeat(16, ${SEAT_TRACK_PX}px)`,
  `repeat(2, ${SEAT_TRACK_PX}px)`,
  `repeat(4, ${SEAT_TRACK_PX}px)`,
  `${LABEL_TRACK_PX}px`,
].join(' ');

export const LABEL_LEFT_TRACK = 1;
export const LABEL_RIGHT_TRACK = 30;
export const AISLE_1_TRACKS: [number, number] = [6, 7];
export const AISLE_2_TRACKS: [number, number] = [24, 25];

/** 1-indexed grid track for a given seat column (1-24). */
export function columnTrack(column: number): number {
  if (column <= 4) return column + 1;
  if (column <= 20) return column + 3;
  return column + 5;
}

/** CSS grid-column value for a single track. */
export function trackSpan(track: number): string {
  return `${track} / ${track + 1}`;
}

/** CSS grid-column value spanning from one column to another (inclusive). */
export function columnSpan(startColumn: number, endColumn: number): string {
  const start = columnTrack(startColumn);
  const end = columnTrack(endColumn);
  return `${start} / ${end + 1}`;
}
