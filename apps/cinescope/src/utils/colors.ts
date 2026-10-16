export type SeatState = 'available' | 'selected' | 'unavailable' | 'accessible';

export const SEAT_COLORS: Record<SeatState, string> = {
  available: '#2E7D32',
  selected: '#F9A825',
  unavailable: '#C62828',
  accessible: '#1565C0',
};

export const SEAT_STATE_LABELS: Record<SeatState, string> = {
  available: 'Available',
  selected: 'Selected',
  unavailable: 'Unavailable',
  accessible: 'Accessible',
};
