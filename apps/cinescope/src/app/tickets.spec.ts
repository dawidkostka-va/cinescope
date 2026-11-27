import { formatPrice, seatPrice, ticketsOf } from './tickets';

describe('seatPrice', () => {
  it('charges 25.00, 32.00 and 39.00 PLN by row', () => {
    expect(seatPrice(1)).toBe(25);
    expect(seatPrice(5)).toBe(25);
    expect(seatPrice(6)).toBe(32);
    expect(seatPrice(10)).toBe(32);
    expect(seatPrice(11)).toBe(39);
    expect(seatPrice(14)).toBe(39);
  });
});

describe('formatPrice', () => {
  it('prints two decimals and the PLN suffix', () => {
    expect(formatPrice(25)).toBe('25.00 PLN');
    expect(formatPrice(121)).toBe('121.00 PLN');
  });
});

describe('ticketsOf', () => {
  it('lists seats ordered by row and then column, with their prices', () => {
    expect(ticketsOf(['R7C12', 'R1C10', 'R7C3'])).toEqual([
      { row: 1, seat: '10', seatIds: ['R1C10'], price: 25 },
      { row: 7, seat: '3', seatIds: ['R7C3'], price: 32 },
      { row: 7, seat: '12', seatIds: ['R7C12'], price: 32 },
    ]);
  });

  it('lists a couch once, with both of its seats and the couch price', () => {
    expect(ticketsOf(['R15C4', 'R15C3'])).toEqual([
      { row: 15, seat: 'Couch 3-4', seatIds: ['R15C3', 'R15C4'], price: 89 },
    ]);
  });

  it('returns no tickets for an empty booking', () => {
    expect(ticketsOf([])).toEqual([]);
  });
});
