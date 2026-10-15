export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export const SEAT_STATE_COLORS: Record<SeatState, string> = {
  available: '#2E7D32',
  selected: '#F9A825',
  unavailable: '#C62828',
  accessible: '#1565C0',
};

export function computeSeatState(
  isAccessible: boolean,
  isOccupied: boolean,
  isSelected: boolean,
): SeatState {
  if (isOccupied) return 'unavailable';
  if (isSelected) return 'selected';
  if (isAccessible) return 'accessible';
  return 'available';
}

export function computeCouchState(isOccupied: boolean, isSelected: boolean): SeatState {
  if (isOccupied) return 'unavailable';
  if (isSelected) return 'selected';
  return 'available';
}
