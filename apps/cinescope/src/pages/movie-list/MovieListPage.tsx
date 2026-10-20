import Button from '@mui/material/Button';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchMovies, fetchScreeningsByDate } from '../../api/client';
import { Movie, Screening } from '../../api/types';
import { resolveSelectedDate, toIsoDate, today } from '../../domain/dateFormat';
import styles from './MovieListPage.module.scss';

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'loaded'; movies: Movie[]; screenings: Screening[] };

interface DayButton {
  label: string;
  date: string;
}

function dayButtons(): DayButton[] {
  return Array.from({ length: 5 }, (_, i) => {
    const date = today().add(i, 'day');
    return { label: i === 0 ? 'Today' : date.format('dddd'), date: toIsoDate(date) };
  });
}

export function MovieListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedDate = resolveSelectedDate(searchParams.get('date'));
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const load = useCallback(() => {
    setState({ status: 'loading' });
    Promise.all([fetchMovies(), fetchScreeningsByDate(selectedDate)])
      .then(([movies, screenings]) => setState({ status: 'loaded', movies, screenings }))
      .catch(() => setState({ status: 'error' }));
  }, [selectedDate]);

  useEffect(() => {
    load();
  }, [load]);

  function selectDate(iso: string): void {
    const isToday = iso === toIsoDate(today());
    setSearchParams(isToday ? {} : { date: iso });
  }

  const buttons = dayButtons();
  const isQuickPickDate = buttons.some((b) => b.date === selectedDate);

  return (
    <div className={styles.page}>
      <div data-testid="day-picker" className={styles.dayPicker}>
        {buttons.map((b) => (
          <Button
            key={b.date}
            data-testid="day-button"
            data-date={b.date}
            data-selected={b.date === selectedDate}
            variant={b.date === selectedDate ? 'contained' : 'outlined'}
            onClick={() => selectDate(b.date)}
          >
            {b.label}
          </Button>
        ))}
        <DatePicker
          data-testid="date-picker"
          className={styles.datePicker}
          label="Choose a date"
          minDate={today()}
          value={isQuickPickDate ? null : dayjs(selectedDate)}
          onChange={(value: Dayjs | null) => {
            if (value && value.isValid()) {
              selectDate(toIsoDate(value));
            }
          }}
        />
      </div>

      {state.status === 'loading' && <div data-testid="movies-loading">Loading…</div>}

      {state.status === 'error' && (
        <div data-testid="movies-error">
          Failed to load movies
          <div>
            <Button data-testid="movies-retry-button" onClick={load} variant="outlined">
              Retry
            </Button>
          </div>
        </div>
      )}

      {state.status === 'loaded' && <MovieCards movies={state.movies} screenings={state.screenings} navigate={navigate} />}
    </div>
  );
}

function MovieCards({
  movies,
  screenings,
  navigate,
}: {
  movies: Movie[];
  screenings: Screening[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const cards = movies
    .map((movie) => ({
      movie,
      screenings: screenings.filter((s) => s.movieId === movie.id).sort((a, b) => a.time.localeCompare(b.time)),
    }))
    .filter((c) => c.screenings.length > 0);

  if (cards.length === 0) {
    return <div data-testid="movies-empty">No screenings on this day</div>;
  }

  return (
    <div data-testid="movie-list">
      {cards.map(({ movie, screenings: movieScreenings }) => (
        <div key={movie.id} data-testid="movie-card" data-movie-id={movie.id} className={styles.card}>
          <div className={styles.cardHeader}>
            <strong data-testid="movie-title">{movie.title}</strong>
            <span data-testid="movie-genre">{movie.genre}</span>
            <span data-testid="movie-runtime">{movie.runtimeMinutes} min</span>
            <span data-testid="movie-format">{movie.format}</span>
          </div>
          <div className={styles.screenings}>
            {movieScreenings.map((s) => (
              <Button
                key={s.id}
                data-testid="screening-button"
                data-screening-id={s.id}
                variant="outlined"
                onClick={() => navigate(`/screenings/${s.id}/seats`)}
              >
                {s.time}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
