import { LABEL_LEFT_TRACK, LABEL_RIGHT_TRACK, trackSpan } from './gridLayout';

interface RowLabelProps {
  row: number;
  side: 'left' | 'right';
}

export function RowLabel({ row, side }: RowLabelProps) {
  const track = side === 'left' ? LABEL_LEFT_TRACK : LABEL_RIGHT_TRACK;
  return (
    <span
      data-testid={side === 'left' ? 'row-label-left' : 'row-label-right'}
      data-row={row}
      style={{
        gridColumn: trackSpan(track),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
      }}
    >
      {row}
    </span>
  );
}
