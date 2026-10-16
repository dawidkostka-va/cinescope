import Button from '@mui/material/Button';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchMovies, fetchScreeningsByDate } from '../lib/api';
import { addDays, resolveSelectedDate, todayISO, weekdayFull } from '../lib/dateUtils';
import { Movie, Screening } from '../lib/types';

interface LoadState {
  status: 'loading' | 'error' | 'loaded';
  movies: Movie[];
  screenings: Screening[];
}

interface MovieCard {
  movie: Movie;
  screenings: Screening[];
}

function buildDayButtons(): { iso: string; label: string }[] {
  const today = todayISO();
  const days = [{ iso: today, label: 'Today' }];
  for (let i = 1; i <= 4; i += 1) {
    const iso = addDays(today, i);
    days.push({ iso, label: weekdayFull(iso) });
  }
  return days;
}

export function MovieListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawDate = searchParams.get('date');
  const selectedDate = resolveSelectedDate(rawDate);
  const dayButtons = buildDayButtons();

  const [state, setState] = useState<LoadState>({ status: 'loading', movies: [], screenings: [] });

  const load = useCallback(() => {
    setState((prev) => ({ ...prev, status: 'loading' }));
    Promise.all([fetchMovies(), fetchScreeningsByDate(selectedDate)])
      .then(([movies, screenings]) => setState({ status: 'loaded', movies, screenings }))
      .catch(() => setState({ status: 'error', movies: [], screenings: [] }));
  }, [selectedDate]);

  useEffect(() => {
    load();
  }, [load]);

  function selectDate(iso: string) {
    setSearchParams({ date: iso });
  }

  function handleDatePickerChange(value: Dayjs | null) {
    if (value && value.isValid()) {
      selectDate(value.format('YYYY-MM-DD'));
    }
  }

  const cards: MovieCard[] = [];
  if (state.status === 'loaded') {
    const screeningsByMovie = new Map<number, Screening[]>();
    for (const screening of state.screenings) {
      const list = screeningsByMovie.get(screening.movieId) ?? [];
      list.push(screening);
      screeningsByMovie.set(screening.movieId, list);
    }
    for (const movie of state.movies) {
      const screenings = screeningsByMovie.get(movie.id);
      if (screenings && screenings.length > 0) {
        cards.push({
          movie,
          screenings: [...screenings].sort((a, b) => a.time.localeCompare(b.time)),
        });
      }
    }
  }

  return (
    <div>
      <div data-testid="day-picker">
        {dayButtons.map((day) => (
          <Button
            key={day.iso}
            data-testid="day-button"
            data-date={day.iso}
            data-selected={day.iso === selectedDate}
            variant={day.iso === selectedDate ? 'contained' : 'outlined'}
            onClick={() => selectDate(day.iso)}
          >
            {day.label}
          </Button>
        ))}
        <DatePicker
          value={dayjs(selectedDate)}
          onChange={handleDatePickerChange}
          disablePast
          slotProps={{ textField: { 'data-testid': 'date-picker' } }}
        />
      </div>
      <div data-testid="movie-list">
        {state.status === 'loading' && <div data-testid="movies-loading">Loading…</div>}
        {state.status === 'error' && (
          <div>
            <div data-testid="movies-error">Failed to load movies</div>
            <Button data-testid="movies-retry-button" onClick={load}>
              Retry
            </Button>
          </div>
        )}
        {state.status === 'loaded' && cards.length === 0 && (
          <div data-testid="movies-empty">No screenings on this day</div>
        )}
        {state.status === 'loaded' &&
          cards.map(({ movie, screenings }) => (
            <div key={movie.id} data-testid="movie-card" data-movie-id={movie.id}>
              <div data-testid="movie-title">{movie.title}</div>
              <div data-testid="movie-genre">{movie.genre}</div>
              <div data-testid="movie-runtime">{movie.runtimeMinutes} min</div>
              <div data-testid="movie-format">{movie.format}</div>
              <div>
                {screenings.map((screening) => (
                  <Button
                    key={screening.id}
                    data-testid="screening-button"
                    data-screening-id={screening.id}
                    onClick={() => navigate(`/screenings/${screening.id}/seats`)}
                  >
                    {screening.time}
                  </Button>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default MovieListPage;
