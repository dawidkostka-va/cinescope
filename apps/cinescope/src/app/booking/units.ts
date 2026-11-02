export const COUCH_ROW = 15;

export interface SeatUnit {
  key: string;
  row: number;
  couch: boolean;
  label: string;
  ids: string[];
  price: number;
}

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function priceFor(row: number): number {
  if (row <= 5) {
    return 25;
  }
  if (row <= 10) {
    return 32;
  }
  return 39;
}

export const COUCH_PRICE = 89;

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}

export function unitsOf(seatIds: readonly string[]): SeatUnit[] {
  const seats = seatIds
    .map((id) => {
      const [row, column] = id.slice(1).split('C').map(Number);
      return { row, column };
    })
    .sort((a, b) => a.row - b.row || a.column - b.column);

  const units: SeatUnit[] = [];
  for (const seat of seats) {
    if (seat.row !== COUCH_ROW) {
      units.push({
        key: seatId(seat.row, seat.column),
        row: seat.row,
        couch: false,
        label: String(seat.column),
        ids: [seatId(seat.row, seat.column)],
        price: priceFor(seat.row),
      });
      continue;
    }
    const start = seat.column % 2 === 1 ? seat.column : seat.column - 1;
    const previous = units.at(-1);
    if (previous?.couch && previous.key === seatId(COUCH_ROW, start)) {
      continue;
    }
    units.push({
      key: seatId(COUCH_ROW, start),
      row: COUCH_ROW,
      couch: true,
      label: `${start}-${start + 1}`,
      ids: [seatId(COUCH_ROW, start), seatId(COUCH_ROW, start + 1)],
      price: COUCH_PRICE,
    });
  }
  return units;
}
