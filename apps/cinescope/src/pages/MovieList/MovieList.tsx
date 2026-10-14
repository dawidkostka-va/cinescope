import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMovies, getScreenings } from '../../lib/api';
import { resolveSelectedDate } from '../../lib/dates';
import { Movie, Screening } from '../../lib/types';
import { DayPicker } from './DayPicker';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; movies: Movie[]; screenings: Screening[] };

export function MovieList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedDate = resolveSelectedDate(searchParams.get('date'));
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const load = useCallback(() => {
    setState({ status: 'loading' });
    Promise.all([getMovies(), getScreenings({ date: selectedDate })])
      .then(([movies, screenings]) => setState({ status: 'loaded', movies, screenings }))
      .catch(() => setState({ status: 'error' }));
  }, [selectedDate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSelectDate = (date: string) => {
    setSearchParams({ date });
  };

  const cards = useMemo(() => {
    if (state.status !== 'loaded') return [];
    return state.movies
      .map((movie) => ({
        movie,
        screenings: state.screenings
          .filter((s) => s.movieId === movie.id)
          .slice()
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((entry) => entry.screenings.length > 0);
  }, [state]);

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', p: 3 }}>
      <DayPicker selectedDate={selectedDate} onSelect={handleSelectDate} />

      <Box sx={{ mt: 3 }}>
        {state.status === 'loading' && <Typography data-testid="movies-loading">Loading&hellip;</Typography>}

        {state.status === 'error' && (
          <Box data-testid="movies-error">
            <Typography sx={{ mb: 1 }}>Failed to load movies</Typography>
            <Button data-testid="movies-retry-button" variant="contained" onClick={load}>
              Retry
            </Button>
          </Box>
        )}

        {state.status === 'loaded' && cards.length === 0 && (
          <Typography data-testid="movies-empty">No screenings on this day</Typography>
        )}

        {state.status === 'loaded' && cards.length > 0 && (
          <Box data-testid="movie-list" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {cards.map(({ movie, screenings }) => (
              <Box
                key={movie.id}
                data-testid="movie-card"
                data-movie-id={movie.id}
                sx={{ border: '1px solid #ccc', borderRadius: 1, p: 2 }}
              >
                <Typography data-testid="movie-title" variant="h6">
                  {movie.title}
                </Typography>
                <Typography data-testid="movie-genre">{movie.genre}</Typography>
                <Typography data-testid="movie-runtime">{movie.runtimeMinutes} min</Typography>
                <Typography data-testid="movie-format">{movie.format}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
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
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
