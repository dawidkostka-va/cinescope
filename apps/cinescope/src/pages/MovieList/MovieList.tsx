import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { getMovies, getScreeningsByDate } from '../../api/client';
import { Movie, Screening } from '../../api/types';
import { resolveSelectedDate } from '../../utils/date';
import { DayPicker } from './DayPicker';

interface MovieEntry {
  movie: Movie;
  screenings: Screening[];
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; entries: MovieEntry[] };

function useMoviesForDate(date: string) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const load = useCallback(() => {
    setState({ status: 'loading' });
    Promise.all([getMovies(), getScreeningsByDate(date)])
      .then(([movies, screenings]) => {
        const byMovie = new Map<number, Screening[]>();
        for (const screening of screenings) {
          const list = byMovie.get(screening.movieId) ?? [];
          list.push(screening);
          byMovie.set(screening.movieId, list);
        }
        const entries = movies
          .filter((movie) => byMovie.has(movie.id))
          .map((movie) => ({
            movie,
            screenings: [...(byMovie.get(movie.id) ?? [])].sort((a, b) => a.time.localeCompare(b.time)),
          }));
        setState({ status: 'loaded', entries });
      })
      .catch(() => setState({ status: 'error' }));
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  return { state, retry: load };
}

export function MovieList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedDate = useMemo(() => resolveSelectedDate(searchParams.get('date')), [searchParams]);
  const { state, retry } = useMoviesForDate(selectedDate);

  function handleSelectDate(date: string) {
    setSearchParams({ date });
  }

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', p: 4 }}>
      <DayPicker selectedDate={selectedDate} onSelectDate={handleSelectDate} />

      {state.status === 'loading' && <Box data-testid="movies-loading">Loading…</Box>}

      {state.status === 'error' && (
        <Box data-testid="movies-error">
          <Typography>Failed to load movies</Typography>
          <Button data-testid="movies-retry-button" onClick={retry}>
            Retry
          </Button>
        </Box>
      )}

      {state.status === 'loaded' && state.entries.length === 0 && (
        <Box data-testid="movies-empty">No screenings on this day</Box>
      )}

      {state.status === 'loaded' && state.entries.length > 0 && (
        <Box data-testid="movie-list" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {state.entries.map(({ movie, screenings }) => (
            <Card key={movie.id} data-testid="movie-card" data-movie-id={movie.id}>
              <CardContent>
                <Typography data-testid="movie-title" variant="h6">
                  {movie.title}
                </Typography>
                <Typography data-testid="movie-genre">{movie.genre}</Typography>
                <Typography data-testid="movie-runtime">{`${movie.runtimeMinutes} min`}</Typography>
                <Typography data-testid="movie-format">{movie.format}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
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
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
