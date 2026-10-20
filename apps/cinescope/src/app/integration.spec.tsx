import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import dayjs from 'dayjs';
import App from './app';
import { ToastProvider } from '../lib/toast-context';
import { BookingProvider } from '../lib/booking-context';

const TODAY = dayjs().format('YYYY-MM-DD');

const MOVIES = [{ id: 1, title: 'The Silent Harbor', genre: 'Drama', runtimeMinutes: 128, format: 'PL subtitles' }];
const SCREENING = { id: 1, movieId: 1, date: TODAY, time: '16:00', occupiedSeats: ['R3C7'] };

function renderApp(initialEntry: string) {
  return render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <ToastProvider>
          <BookingProvider>
            <App />
          </BookingProvider>
        </ToastProvider>
      </MemoryRouter>
    </LocalizationProvider>,
  );
}

describe('booking flow', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/movies')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(MOVIES) });
        }
        if (url.includes('/screenings/1')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(SCREENING) });
        }
        if (url.includes('/screenings')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve([SCREENING]) });
        }
        if (url.includes('/reservations')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 1 }) });
        }
        return Promise.reject(new Error(`unexpected url ${url}`));
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the movie list then the seat map with 308 selectable elements', async () => {
    renderApp('/');

    await waitFor(() => expect(screen.getByTestId('movie-card')).toBeTruthy());
    expect(screen.getByTestId('movie-title').textContent).toBe('The Silent Harbor');

    fireEvent.click(screen.getByTestId('screening-button'));

    await waitFor(() => expect(screen.getByTestId('seat-map-title')).toBeTruthy());
    expect(screen.getByTestId('seat-map-subtitle').textContent).toContain('16:00');

    const seats = screen.getAllByTestId('seat');
    const couches = screen.getAllByTestId('couch');
    expect(seats).toHaveLength(296);
    expect(couches).toHaveLength(12);

    const occupiedSeat = seats.find((el) => el.getAttribute('data-row') === '3' && el.getAttribute('data-column') === '7');
    expect(occupiedSeat?.getAttribute('data-state')).toBe('unavailable');

    const freeSeat = seats.find((el) => el.getAttribute('data-row') === '7' && el.getAttribute('data-column') === '12');
    expect(freeSeat).toBeTruthy();
    fireEvent.click(freeSeat as HTMLElement);
    await waitFor(() => expect(freeSeat?.getAttribute('data-state')).toBe('selected'));

    expect(screen.getByTestId('selected-seats-count').textContent).toBe('Selected seats: 1');
    expect(screen.getByTestId('selected-seats-row').textContent).toBe('Row 7: 12');

    fireEvent.click(screen.getByTestId('continue-button'));

    await waitFor(() => expect(screen.getByTestId('summary-title')).toBeTruthy());
    const item = screen.getByTestId('summary-item');
    expect(within(item).getByTestId('summary-item-row').textContent).toBe('7');
    expect(within(item).getByTestId('summary-item-seat').textContent).toBe('12');
    expect(within(item).getByTestId('summary-item-price').textContent).toBe('32.00 PLN');
    expect(screen.getByTestId('summary-total').textContent).toBe('Total: 32.00 PLN');

    fireEvent.click(screen.getByTestId('confirm-button'));
    await waitFor(() => expect(screen.getByTestId('checkout-title')).toBeTruthy());
    expect(screen.getByTestId('pay-button').textContent).toBe('Pay 32.00 PLN');

    fireEvent.change(screen.getByTestId('first-name-input').querySelector('input') as HTMLInputElement, {
      target: { value: 'Anna' },
    });
    fireEvent.change(screen.getByTestId('last-name-input').querySelector('input') as HTMLInputElement, {
      target: { value: 'Kowalska' },
    });
    fireEvent.change(screen.getByTestId('email-input').querySelector('input') as HTMLInputElement, {
      target: { value: 'anna@example.com' },
    });
    fireEvent.change(screen.getByTestId('confirm-email-input').querySelector('input') as HTMLInputElement, {
      target: { value: 'anna@example.com' },
    });
    fireEvent.click(screen.getByTestId('terms-checkbox').querySelector('input') as HTMLInputElement);

    fireEvent.click(screen.getByTestId('pay-button'));

    await waitFor(() => expect(screen.getByTestId('confirmation-heading')).toBeTruthy());
    expect(screen.getByTestId('confirmation-message').textContent).toBe(
      'Your tickets will be sent shortly to anna@example.com',
    );

    fireEvent.click(screen.getByTestId('confirmation-continue-button'));
    await waitFor(() => expect(screen.getByTestId('movie-card')).toBeTruthy());
  });
});
