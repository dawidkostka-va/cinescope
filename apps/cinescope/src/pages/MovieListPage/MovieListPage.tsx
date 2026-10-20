import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Dayjs } from 'dayjs';
import { fetchMovies, fetchScreeningsByDate } from '../../api';
import type { Movie, Screening } from '../../types';
import { parseDateParam, toISODate } from '../../dateUtils';
import { DayPicker } from './DayPicker';

interface MovieWithScreenings {
  movie: Movie;
  screenings: Screening[];
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; movies: MovieWithScreenings[] };

export function MovieListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedDate = parseDateParam(searchParams.get('date'));
  const selectedISO = toISODate(selectedDate);
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    async function load() {
      try {
        const [movies, screenings] = await Promise.all([
          fetchMovies(),
          fetchScreeningsByDate(selectedISO),
        ]);
        if (cancelled) return;
        const screeningsByMovie = new Map<number, Screening[]>();
        for (const screening of screenings) {
          const list = screeningsByMovie.get(screening.movieId) ?? [];
          list.push(screening);
          screeningsByMovie.set(screening.movieId, list);
        }
        const moviesWithScreenings: MovieWithScreenings[] = movies
          .map((movie) => ({
            movie,
            screenings: (screeningsByMovie.get(movie.id) ?? []).sort((a, b) =>
              a.time.localeCompare(b.time),
            ),
          }))
          .filter((entry) => entry.screenings.length > 0);
        setState({ status: 'loaded', movies: moviesWithScreenings });
      } catch {
        if (!cancelled) {
          setState({ status: 'error' });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedISO, retryToken]);

  const handleSelectDate = useCallback(
    (date: Dayjs) => {
      setSearchParams({ date: toISODate(date) });
    },
    [setSearchParams],
  );

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', p: 3 }}>
      <Stack spacing={3}>
        <DayPicker selectedDate={selectedDate} onSelectDate={handleSelectDate} />

        {state.status === 'loading' && <Typography data-testid="movies-loading">Loading…</Typography>}

        {state.status === 'error' && (
          <Box data-testid="movies-error">
            <Typography>Failed to load movies</Typography>
            <Button
              data-testid="movies-retry-button"
              variant="contained"
              onClick={() => setRetryToken((n) => n + 1)}
            >
              Retry
            </Button>
          </Box>
        )}

        {state.status === 'loaded' && state.movies.length === 0 && (
          <Typography data-testid="movies-empty">No screenings on this day</Typography>
        )}

        {state.status === 'loaded' && state.movies.length > 0 && (
          <Stack data-testid="movie-list" spacing={2}>
            {state.movies.map(({ movie, screenings }) => (
              <Card key={movie.id} data-testid="movie-card" data-movie-id={movie.id}>
                <CardContent>
                  <Typography variant="h6" data-testid="movie-title">
                    {movie.title}
                  </Typography>
                  <Typography data-testid="movie-genre">{movie.genre}</Typography>
                  <Typography data-testid="movie-runtime">{movie.runtimeMinutes} min</Typography>
                  <Typography data-testid="movie-format">{movie.format}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
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
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
