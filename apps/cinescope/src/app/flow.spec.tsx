import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { fireEvent, render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import { MemoryRouter } from 'react-router-dom';
import App from './app';

const today = dayjs().format('YYYY-MM-DD');

const movies = [
  { id: 1, title: 'The Silent Harbor', genre: 'Drama', runtimeMinutes: 128, format: 'PL subtitles' },
];

const screenings = [
  { id: 1, movieId: 1, date: today, time: '16:00', occupiedSeats: ['R3C7'] },
];

function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => body } as Response);
}

function installFetchMock() {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, init?: RequestInit) => {
      const path = url.replace('http://localhost:3000', '');
      if (path === '/movies') return jsonResponse(movies);
      if (path.startsWith('/movies/')) {
        return jsonResponse(movies.find((m) => m.id === Number(path.split('/')[2])));
      }
      if (path.startsWith('/screenings/')) {
        const found = screenings.find((s) => s.id === Number(path.split('/')[2]));
        return found ? jsonResponse(found) : jsonResponse(null, 404);
      }
      if (path.startsWith('/screenings')) return jsonResponse(screenings);
      if (path === '/reservations' && init?.method === 'POST') {
        return jsonResponse({ id: 999, ...JSON.parse(init.body as string) }, 201);
      }
      return jsonResponse(null, 404);
    }),
  );
}

function renderApp(initialEntry: string) {
  return render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <App />
      </MemoryRouter>
    </LocalizationProvider>,
  );
}

function inputOf(testId: string): HTMLInputElement {
  const el = screen.getByTestId(testId).querySelector('input');
  if (!el) throw new Error(`no <input> inside testid ${testId}`);
  return el;
}

beforeEach(() => {
  sessionStorage.clear();
});

describe('booking flow', () => {
  it('goes from the movie list through to a paid confirmation and back', async () => {
    installFetchMock();
    renderApp('/');

    await screen.findByTestId('movie-card');
    fireEvent.click(screen.getByTestId('screening-button'));

    await screen.findByTestId('seat-map-title');

    const seat = screen
      .getAllByTestId('seat')
      .find((el) => el.getAttribute('data-state') === 'available');
    const couch = screen
      .getAllByTestId('couch')
      .find((el) => el.getAttribute('data-state') === 'available');
    expect(seat).toBeTruthy();
    expect(couch).toBeTruthy();
    fireEvent.click(seat as HTMLElement);
    fireEvent.click(couch as HTMLElement);

    expect(screen.getByTestId('selected-seats-count').textContent).toBe('Selected seats: 3');

    fireEvent.click(screen.getByTestId('continue-button'));

    await screen.findByTestId('summary-title');
    expect(screen.getAllByTestId('summary-item')).toHaveLength(2);

    fireEvent.click(screen.getByTestId('confirm-button'));
    await screen.findByTestId('checkout-title');

    fireEvent.click(screen.getByTestId('pay-button'));
    expect((await screen.findByTestId('toast')).textContent).toContain('The form contains errors');
    expect(screen.getByTestId('terms-error')).toBeTruthy();

    fireEvent.change(inputOf('first-name-input'), { target: { value: 'Anna' } });
    fireEvent.change(inputOf('last-name-input'), { target: { value: 'Kowalska' } });
    fireEvent.change(inputOf('email-input'), { target: { value: 'anna@example.com' } });
    fireEvent.change(inputOf('confirm-email-input'), { target: { value: 'anna@example.com' } });
    fireEvent.click(inputOf('terms-checkbox'));

    fireEvent.click(screen.getByTestId('pay-button'));

    await screen.findByTestId('confirmation-heading');
    expect(screen.getByTestId('confirmation-message').textContent).toContain('anna@example.com');

    fireEvent.click(screen.getByTestId('confirmation-continue-button'));

    await screen.findByTestId('day-picker');
    expect(sessionStorage.getItem('cinescope:booking')).toBeNull();
  });

  it('redirects away from the summary when there is no matching booking', async () => {
    installFetchMock();
    renderApp('/screenings/1/summary');
    await screen.findByTestId('day-picker');
  });

  it('redirects away from the confirmation when the booking is not paid', async () => {
    installFetchMock();
    renderApp('/confirmation');
    await screen.findByTestId('day-picker');
  });
});
