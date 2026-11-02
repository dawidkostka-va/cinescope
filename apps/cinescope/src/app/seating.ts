export const ROWS = 15;
export const COLUMNS = 24;
export const MAX_SEATS = 10;
export const COUCH_ROW = 15;

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface Ticket {
  row: number;
  columnStart: number;
  columnEnd: number;
  couch: boolean;
  ids: string[];
  price: number;
}

export function seatId(row: number, column: number): string {
  return `R${row}C${column}`;
}

export function priceOf(row: number, couch: boolean): number {
  if (couch) return 89;
  if (row <= 5) return 25;
  if (row <= 10) return 32;
  return 39;
}

export function makeTicket(row: number, columnStart: number): Ticket {
  const couch = row === COUCH_ROW;
  const columnEnd = couch ? columnStart + 1 : columnStart;
  const ids = couch ? [seatId(row, columnStart), seatId(row, columnEnd)] : [seatId(row, columnStart)];
  return { row, columnStart, columnEnd, couch, ids, price: priceOf(row, couch) };
}

export function ticketsFromSeats(seats: string[]): Ticket[] {
  const tickets = new Map<string, Ticket>();
  for (const id of seats) {
    const match = /^R(\d+)C(\d+)$/.exec(id);
    if (!match) continue;
    const row = Number(match[1]);
    const column = Number(match[2]);
    const start = row === COUCH_ROW ? column - ((column - 1) % 2) : column;
    const ticket = makeTicket(row, start);
    tickets.set(ticket.ids[0], ticket);
  }
  return [...tickets.values()].sort((a, b) => a.row - b.row || a.columnStart - b.columnStart);
}

export function formatPrice(value: number): string {
  return `${value.toFixed(2)} PLN`;
}

export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return toIsoDate(date) === value && date.getFullYear() === y ? date : null;
}

export function weekdayName(date: Date): string {
  return WEEKDAYS[date.getDay()];
}

export function showDate(isoDate: string, time: string): string {
  const date = parseIsoDate(isoDate);
  if (!date) return `${isoDate} ${time}`;
  return `${weekdayName(date)} ${date.getDate()} ${MONTHS[date.getMonth()]} ${time}`;
}
