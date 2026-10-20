import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { fetchMovies, fetchScreeningsByDate } from '../../lib/api';
import { Movie, Screening } from '../../lib/types';
import { resolveSelectedDate, todayISO, upcomingDayOptions } from '../../lib/date';
import './movie-list.scss';

interface MovieWithScreenings {
  movie: Movie;
  screenings: Screening[];
}

type LoadState = 'loading' | 'error' | 'loaded';

export function MovieList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedDate = resolveSelectedDate(searchParams.get('date'));

  const [state, setState] = useState<LoadState>('loading');
  const [items, setItems] = useState<MovieWithScreenings[]>([]);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    Promise.all([fetchMovies(), fetchScreeningsByDate(selectedDate)])
      .then(([movies, screenings]) => {
        if (cancelled) return;
        const byMovie = new Map<number, Screening[]>();
        for (const screening of screenings) {
          const list = byMovie.get(screening.movieId) ?? [];
          list.push(screening);
          byMovie.set(screening.movieId, list);
        }
        const result: MovieWithScreenings[] = [];
        for (const movie of movies) {
          const list = byMovie.get(movie.id);
          if (list && list.length > 0) {
            result.push({
              movie,
              screenings: [...list].sort((a, b) => a.time.localeCompare(b.time)),
            });
          }
        }
        setItems(result);
        setState('loaded');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate, retryToken]);

  const dayOptions = useMemo(() => upcomingDayOptions(), []);

  const selectDate = (date: string) => {
    setSearchParams({ date });
  };

  const retry = () => setRetryToken((t) => t + 1);

  return (
    <div className="movie-list-page">
      <div className="day-picker" data-testid="day-picker">
        {dayOptions.map((option) => (
          <Button
            key={option.date}
            data-testid="day-button"
            data-date={option.date}
            data-selected={option.date === selectedDate ? 'true' : 'false'}
            variant={option.date === selectedDate ? 'contained' : 'outlined'}
            onClick={() => selectDate(option.date)}
          >
            {option.label}
          </Button>
        ))}
        <DatePicker
          label="Choose a date"
          value={dayjs(selectedDate)}
          minDate={dayjs(todayISO())}
          onChange={(value) => {
            if (value && value.isValid()) {
              selectDate(value.format('YYYY-MM-DD'));
            }
          }}
          slotProps={{
            textField: { slotProps: { htmlInput: { 'data-testid': 'date-picker' } } },
          }}
        />
      </div>

      {state === 'loading' && <div data-testid="movies-loading">Loading…</div>}

      {state === 'error' && (
        <div data-testid="movies-error">
          <Typography>Failed to load movies</Typography>
          <Button data-testid="movies-retry-button" onClick={retry} variant="contained">
            Retry
          </Button>
        </div>
      )}

      {state === 'loaded' && items.length === 0 && (
        <div data-testid="movies-empty">No screenings on this day</div>
      )}

      {state === 'loaded' && items.length > 0 && (
        <div className="movie-list" data-testid="movie-list">
          {items.map(({ movie, screenings }) => (
            <div
              className="movie-card"
              data-testid="movie-card"
              data-movie-id={movie.id}
              key={movie.id}
            >
              <div data-testid="movie-title" className="movie-title">
                {movie.title}
              </div>
              <div data-testid="movie-genre">{movie.genre}</div>
              <div data-testid="movie-runtime">{movie.runtimeMinutes} min</div>
              <div data-testid="movie-format">{movie.format}</div>
              <div className="screening-buttons">
                {screenings.map((screening) => (
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

export default MovieList;
