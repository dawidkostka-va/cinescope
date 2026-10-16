import { ROW_COUNT } from '../../lib/seats';
import { SeatRow } from './SeatRow';

interface SeatMapProps {
  occupiedSeats: ReadonlySet<string>;
  selectedSeats: ReadonlySet<string>;
  onToggle: (seatIds: string[]) => void;
}

const ROWS = Array.from({ length: ROW_COUNT }, (_, i) => i + 1);

export function SeatMap({ occupiedSeats, selectedSeats, onToggle }: SeatMapProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        data-testid="screen-indicator"
        style={{
          width: '70%',
          maxWidth: 600,
          margin: '0 auto 24px',
          padding: '8px 0',
          textAlign: 'center',
          backgroundColor: '#ddd',
          borderRadius: '50% / 100%',
          letterSpacing: 4,
          fontWeight: 600,
        }}
      >
        SCREEN
      </div>

      <div data-testid="seat-map">
        {ROWS.map((row) => (
          <SeatRow
            key={row}
            row={row}
            occupiedSeats={occupiedSeats}
            selectedSeats={selectedSeats}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}
