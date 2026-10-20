import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { fetchMovies, fetchScreeningsByDate } from '../../api/client';
import { Movie, Screening } from '../../types';
import { resolveSelectedDate } from '../../utils/date';
import { DayPicker } from './DayPicker';
import { MovieCard } from './MovieCard';

type Status = 'loading' | 'error' | 'loaded';

export function MovieListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDate = resolveSelectedDate(searchParams.get('date'));

  const [status, setStatus] = useState<Status>('loading');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);

  useEffect(() => {
    if (searchParams.get('date') !== selectedDate) {
      setSearchParams({ date: selectedDate }, { replace: true });
    }
  }, [searchParams, selectedDate, setSearchParams]);

  const load = useCallback(() => {
    setStatus('loading');
    Promise.all([fetchMovies(), fetchScreeningsByDate(selectedDate)])
      .then(([loadedMovies, loadedScreenings]) => {
        setMovies(loadedMovies);
        setScreenings(loadedScreenings);
        setStatus('loaded');
      })
      .catch(() => {
        setStatus('error');
      });
  }, [selectedDate]);

  useEffect(() => {
    load();
  }, [load]);

  const cards = useMemo(() => {
    return movies
      .map((movie) => ({
        movie,
        screenings: screenings
          .filter((screening) => screening.movieId === movie.id)
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((card) => card.screenings.length > 0);
  }, [movies, screenings]);

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', p: 3 }}>
      <DayPicker
        selectedDate={selectedDate}
        onSelect={(date) => setSearchParams({ date })}
      />

      {status === 'loading' && <Box data-testid="movies-loading">Loading…</Box>}

      {status === 'error' && (
        <Box data-testid="movies-error">
          <Typography>Failed to load movies</Typography>
          <Button data-testid="movies-retry-button" variant="contained" onClick={load}>
            Retry
          </Button>
        </Box>
      )}

      {status === 'loaded' && cards.length === 0 && (
        <Box data-testid="movies-empty">No screenings on this day</Box>
      )}

      {status === 'loaded' && cards.length > 0 && (
        <Box data-testid="movie-list">
          {cards.map((card) => (
            <MovieCard key={card.movie.id} movie={card.movie} screenings={card.screenings} />
          ))}
        </Box>
      )}
    </Box>
  );
}
