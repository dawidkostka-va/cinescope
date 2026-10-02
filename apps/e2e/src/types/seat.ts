export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export interface SeatPosition {
  row: number;
  column: number;
}
