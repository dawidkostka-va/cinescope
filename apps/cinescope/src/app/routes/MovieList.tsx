import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import { DayPicker } from '../components/DayPicker';
import { fetchMovies, fetchScreeningsByDate } from '../api/client';
import { Movie, Screening } from '../api/types';
import { resolveSelectedDate } from '../utils/dates';

type Status = 'loading' | 'error' | 'loaded';

export function MovieList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedDate = resolveSelectedDate(searchParams.get('date'));

  const [status, setStatus] = useState<Status>('loading');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);

  const load = useCallback(() => {
    setStatus('loading');
    Promise.all([fetchMovies(), fetchScreeningsByDate(selectedDate)])
      .then(([moviesResult, screeningsResult]) => {
        setMovies(moviesResult);
        setScreenings(screeningsResult);
        setStatus('loaded');
      })
      .catch(() => setStatus('error'));
  }, [selectedDate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSelectDate = (date: string) => {
    setSearchParams({ date });
  };

  const moviesWithScreenings = movies
    .map((movie) => ({
      movie,
      screenings: screenings
        .filter((s) => s.movieId === movie.id)
        .sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0)),
    }))
    .filter((entry) => entry.screenings.length > 0);

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', p: 4 }}>
      <DayPicker selectedDate={selectedDate} onSelect={handleSelectDate} />

      {status === 'loading' && <Typography data-testid="movies-loading">Loading…</Typography>}

      {status === 'error' && (
        <Box data-testid="movies-error">
          <Typography>Failed to load movies</Typography>
          <Button data-testid="movies-retry-button" onClick={load}>
            Retry
          </Button>
        </Box>
      )}

      {status === 'loaded' && moviesWithScreenings.length === 0 && (
        <Typography data-testid="movies-empty">No screenings on this day</Typography>
      )}

      {status === 'loaded' && moviesWithScreenings.length > 0 && (
        <Stack data-testid="movie-list" spacing={2}>
          {moviesWithScreenings.map(({ movie, screenings: movieScreenings }) => (
            <Card key={movie.id} data-testid="movie-card" data-movie-id={movie.id}>
              <CardContent>
                <Typography data-testid="movie-title" variant="h6">
                  {movie.title}
                </Typography>
                <Typography data-testid="movie-genre">{movie.genre}</Typography>
                <Typography data-testid="movie-runtime">{movie.runtimeMinutes} min</Typography>
                <Typography data-testid="movie-format">{movie.format}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                  {movieScreenings.map((screening) => (
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
    </Box>
  );
}

export default MovieList;
