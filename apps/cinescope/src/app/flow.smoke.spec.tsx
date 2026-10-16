import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './app';

const today = dayjs().format('YYYY-MM-DD');
const movie = { id: 1, title: 'The Silent Harbor', genre: 'Drama', runtimeMinutes: 128, format: 'PL subtitles' };
const screening = { id: 1, movieId: 1, date: today, time: '16:00', occupiedSeats: [] as string[] };

function jsonResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  } as Response);
}

beforeEach(() => {
  sessionStorage.clear();
  global.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith('/movies')) return jsonResponse([movie]);
    if (url.includes('/screenings?date=')) return jsonResponse([screening]);
    if (url === 'http://localhost:3000/screenings/1') return jsonResponse(screening);
    if (url === 'http://localhost:3000/movies/1') return jsonResponse(movie);
    if (url.endsWith('/reservations')) {
      const body = JSON.parse(String(init?.body));
      return jsonResponse({ ...body, id: 999 }, 201);
    }
    return Promise.reject(new Error(`unexpected url ${url}`));
  }) as unknown as typeof fetch;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderApp(initialEntry = '/') {
  return render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <App />
      </MemoryRouter>
    </LocalizationProvider>,
  );
}

describe('full booking flow', () => {
  it('goes from movie list to confirmation', async () => {
    renderApp('/');

    expect(await screen.findByTestId('movie-card')).toBeTruthy();
    expect(screen.getByTestId('movie-title').textContent).toBe('The Silent Harbor');
    expect(screen.getByTestId('movie-runtime').textContent).toBe('128 min');

    fireEvent.click(screen.getByTestId('screening-button'));

    expect(await screen.findByTestId('seat-map-title')).toBeTruthy();
    expect(screen.getByTestId('seat-map-subtitle').textContent).toContain('16:00');

    const seats = screen.getAllByTestId('seat');
    const availableSeat = seats.find((s) => s.getAttribute('data-state') === 'available');
    expect(availableSeat).toBeTruthy();
    fireEvent.click(availableSeat as HTMLElement);

    expect(screen.getByTestId('selected-seats-count').textContent).toBe('Selected seats: 1');

    fireEvent.click(screen.getByTestId('continue-button'));

    expect(await screen.findByTestId('summary-title')).toBeTruthy();
    expect(screen.getAllByTestId('summary-item').length).toBe(1);

    fireEvent.click(screen.getByTestId('confirm-button'));

    expect(await screen.findByTestId('checkout-title')).toBeTruthy();

    fireEvent.click(screen.getByTestId('pay-button'));
    expect(await screen.findByTestId('first-name-error')).toBeTruthy();
    expect(screen.getByTestId('terms-error')).toBeTruthy();

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

    expect(await screen.findByTestId('confirmation-heading')).toBeTruthy();
    expect(screen.getByTestId('confirmation-message').textContent).toContain('anna@example.com');

    fireEvent.click(screen.getByTestId('confirmation-continue-button'));
    expect(await screen.findByTestId('day-picker')).toBeTruthy();
  });

  it('redirects to / for an unknown screening', async () => {
    renderApp('/screenings/999/seats');
    await waitFor(() => expect(screen.getByTestId('day-picker')).toBeTruthy());
  });

  it('selects a couch, enforces the seat cap, removes the last item and survives reload', async () => {
    renderApp('/screenings/1/seats');
    expect(await screen.findByTestId('seat-map-title')).toBeTruthy();

    const couch = screen.getAllByTestId('couch')[0];
    expect(couch.getAttribute('data-column-start')).toBe('1');
    expect(couch.getAttribute('data-column-end')).toBe('2');
    fireEvent.click(couch);
    expect(screen.getByTestId('selected-seats-count').textContent).toBe('Selected seats: 2');
    expect(screen.getByTestId('selected-seats-row').textContent).toBe('Row 15: 1-2');

    const seats = screen.getAllByTestId('seat');
    const availableSeats = seats.filter((s) => s.getAttribute('data-state') === 'available');
    for (const seat of availableSeats.slice(0, 9)) {
      fireEvent.click(seat);
    }
    expect(screen.getByTestId('selected-seats-count').textContent).toBe('Selected seats: 10');

    const stillAvailable = screen.getAllByTestId('seat').find((s) => s.getAttribute('data-state') === 'available');
    fireEvent.click(stillAvailable as HTMLElement);
    expect(await screen.findByTestId('toast')).toBeTruthy();
    expect(screen.getByTestId('toast').textContent).toBe('Maximum 10 seats per booking');
    expect(screen.getByTestId('selected-seats-count').textContent).toBe('Selected seats: 10');

    fireEvent.click(screen.getByTestId('continue-button'));
    expect(await screen.findByTestId('summary-title')).toBeTruthy();
    expect(screen.getByTestId('summary-total').textContent).toBe('Total: 289.00 PLN');

    while (screen.queryAllByTestId('summary-item-remove-button').length > 0) {
      fireEvent.click(screen.getAllByTestId('summary-item-remove-button')[0]);
    }
    expect(await screen.findByTestId('seat-map-title')).toBeTruthy();
    expect(screen.getByTestId('selected-seats-count').textContent).toBe('Selected seats: 0');

    fireEvent.click(screen.getAllByTestId('seat').find((s) => s.getAttribute('data-state') === 'available') as HTMLElement);
    expect(screen.getByTestId('selected-seats-count').textContent).toBe('Selected seats: 1');

    cleanup();
    renderApp('/screenings/1/seats');
    expect(await screen.findByTestId('seat-map-title')).toBeTruthy();
    expect(screen.getByTestId('selected-seats-count').textContent).toBe('Selected seats: 1');
  });
});
