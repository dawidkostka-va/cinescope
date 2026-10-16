import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { DayPicker } from '../../components/DayPicker/DayPicker';
import { fetchMovies, fetchScreenings } from '../../lib/api';
import { Movie, Screening } from '../../lib/types';
import { isPastIsoDate, isValidIsoDate, todayIsoDate } from '../../lib/dates';

type Status = 'loading' | 'error' | 'loaded';

export function MovieList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);

  const rawDate = searchParams.get('date');
  const selectedDate = useMemo(() => {
    if (rawDate && isValidIsoDate(rawDate) && !isPastIsoDate(rawDate)) {
      return rawDate;
    }
    return todayIsoDate();
  }, [rawDate]);

  useEffect(() => {
    if (rawDate !== selectedDate) {
      setSearchParams({ date: selectedDate }, { replace: true });
    }
  }, [rawDate, selectedDate, setSearchParams]);

  const load = useCallback(() => {
    setStatus('loading');
    Promise.all([fetchMovies(), fetchScreenings()])
      .then(([loadedMovies, loadedScreenings]) => {
        setMovies(loadedMovies);
        setScreenings(loadedScreenings);
        setStatus('loaded');
      })
      .catch(() => {
        setStatus('error');
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSelectDay = (isoDate: string) => {
    setSearchParams({ date: isoDate });
  };

  const moviesForDay = useMemo(() => {
    return movies
      .map((movie) => {
        const dayScreenings = screenings
          .filter((s) => s.movieId === movie.id && s.date === selectedDate)
          .sort((a, b) => a.time.localeCompare(b.time));
        return { movie, screenings: dayScreenings };
      })
      .filter((entry) => entry.screenings.length > 0);
  }, [movies, screenings, selectedDate]);

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', p: 3 }}>
      <DayPicker selectedDate={selectedDate} onSelect={handleSelectDay} />

      <Box sx={{ mt: 3 }}>
        {status === 'loading' && (
          <Typography data-testid="movies-loading">Loading…</Typography>
        )}

        {status === 'error' && (
          <Stack data-testid="movies-error" spacing={2} sx={{ alignItems: 'flex-start' }}>
            <Typography>Failed to load movies</Typography>
            <Button data-testid="movies-retry-button" variant="contained" onClick={load}>
              Retry
            </Button>
          </Stack>
        )}

        {status === 'loaded' && moviesForDay.length === 0 && (
          <Typography data-testid="movies-empty">No screenings on this day</Typography>
        )}

        {status === 'loaded' && moviesForDay.length > 0 && (
          <Stack data-testid="movie-list" spacing={2}>
            {moviesForDay.map(({ movie, screenings: dayScreenings }) => (
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
                <Typography data-testid="movie-runtime">
                  {movie.runtimeMinutes} min
                </Typography>
                <Typography data-testid="movie-format">{movie.format}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                  {dayScreenings.map((screening) => (
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
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
