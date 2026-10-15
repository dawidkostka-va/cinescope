import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import { getMovies, getScreeningsByDate } from '../../api/client';
import type { Movie, Screening } from '../../api/types';
import { addDays, resolveSelectedDate, todayISO, weekdayName } from '../../domain/dates';

const QUICK_DAY_COUNT = 5;

interface LoadState {
  status: 'loading' | 'error' | 'loaded';
  movies: Movie[];
  screenings: Screening[];
}

export function MovieList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dateParam = searchParams.get('date');
  const selectedDate = resolveSelectedDate(dateParam);

  const [state, setState] = useState<LoadState>({ status: 'loading', movies: [], screenings: [] });

  useEffect(() => {
    if (dateParam !== selectedDate) {
      setSearchParams({ date: selectedDate }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateParam, selectedDate]);

  const load = useMemo(
    () => async () => {
      setState((current) => ({ ...current, status: 'loading' }));
      try {
        const [movies, screenings] = await Promise.all([getMovies(), getScreeningsByDate(selectedDate)]);
        setState({ status: 'loaded', movies, screenings });
      } catch {
        setState((current) => ({ ...current, status: 'error' }));
      }
    },
    [selectedDate],
  );

  useEffect(() => {
    load();
  }, [load]);

  const quickDays = useMemo(() => {
    const days: { date: string; label: string }[] = [];
    const today = todayISO();
    for (let i = 0; i < QUICK_DAY_COUNT; i += 1) {
      const date = addDays(today, i);
      days.push({ date, label: i === 0 ? 'Today' : weekdayName(date) });
    }
    return days;
  }, []);

  function selectDate(date: string) {
    setSearchParams({ date });
  }

  function handleDatePickerChange(value: Dayjs | null) {
    if (value && value.isValid()) {
      selectDate(value.format('YYYY-MM-DD'));
    }
  }

  const screeningsByMovie = useMemo(() => {
    const map = new Map<number, Screening[]>();
    for (const screening of state.screenings) {
      const list = map.get(screening.movieId) ?? [];
      list.push(screening);
      map.set(screening.movieId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.time.localeCompare(b.time));
    }
    return map;
  }, [state.screenings]);

  const moviesWithScreenings = state.movies.filter((movie) => (screeningsByMovie.get(movie.id)?.length ?? 0) > 0);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <div data-testid="day-picker" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24 }}>
        {quickDays.map((day) => (
          <Button
            key={day.date}
            data-testid="day-button"
            data-date={day.date}
            data-selected={day.date === selectedDate}
            variant={day.date === selectedDate ? 'contained' : 'outlined'}
            onClick={() => selectDate(day.date)}
          >
            {day.label}
          </Button>
        ))}
        <DatePicker
          value={dayjs(selectedDate)}
          onChange={handleDatePickerChange}
          minDate={dayjs(todayISO())}
          slotProps={{ textField: { htmlInput: { 'data-testid': 'date-picker' } } }}
        />
      </div>

      {state.status === 'loading' && (
        <Typography data-testid="movies-loading">Loading…</Typography>
      )}

      {state.status === 'error' && (
        <div>
          <Typography data-testid="movies-error">Failed to load movies</Typography>
          <Button data-testid="movies-retry-button" onClick={() => load()}>
            Retry
          </Button>
        </div>
      )}

      {state.status === 'loaded' && moviesWithScreenings.length === 0 && (
        <Typography data-testid="movies-empty">No screenings on this day</Typography>
      )}

      {state.status === 'loaded' && moviesWithScreenings.length > 0 && (
        <div data-testid="movie-list">
          {moviesWithScreenings.map((movie) => (
            <div
              key={movie.id}
              data-testid="movie-card"
              data-movie-id={movie.id}
              style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16 }}
            >
              <Typography data-testid="movie-title" variant="h6">
                {movie.title}
              </Typography>
              <div data-testid="movie-genre">{movie.genre}</div>
              <div data-testid="movie-runtime">{movie.runtimeMinutes} min</div>
              <div data-testid="movie-format">{movie.format}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {(screeningsByMovie.get(movie.id) ?? []).map((screening) => (
                  <Button
                    key={screening.id}
                    data-testid="screening-button"
                    data-screening-id={screening.id}
                    variant="outlined"
                    onClick={() => navigate(`/screenings/${screening.id}/seats`)}
                  >
                    {screening.time}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
