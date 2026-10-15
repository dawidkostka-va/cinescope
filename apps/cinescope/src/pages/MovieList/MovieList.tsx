import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMovies, getScreenings } from '../../api/client';
import { Movie, Screening } from '../../api/types';
import { resolveSelectedDate, todayISO, weekdayName } from '../../lib/dateFormat';

interface DayOption {
  iso: string;
  label: string;
}

function buildDayOptions(): DayOption[] {
  const options: DayOption[] = [];
  for (let i = 0; i < 5; i += 1) {
    const date = dayjs().add(i, 'day');
    options.push({ iso: date.format('YYYY-MM-DD'), label: i === 0 ? 'Today' : weekdayName(date) });
  }
  return options;
}

export function MovieList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dayOptions = buildDayOptions();
  const selectedDate = resolveSelectedDate(searchParams.get('date'));

  const [movies, setMovies] = useState<Movie[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (date: string) => {
    setLoading(true);
    setError(false);
    try {
      const [moviesResult, screeningsResult] = await Promise.all([getMovies(), getScreenings({ date })]);
      setMovies(moviesResult);
      setScreenings(screeningsResult);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(selectedDate);
  }, [load, selectedDate]);

  function selectDate(iso: string) {
    setSearchParams({ date: iso });
  }

  const isPresetDate = dayOptions.some((option) => option.iso === selectedDate);

  const moviesForDay = movies
    .map((movie) => ({
      movie,
      screeningsToday: screenings
        .filter((screening) => screening.movieId === movie.id && screening.date === selectedDate)
        .sort((a, b) => a.time.localeCompare(b.time)),
    }))
    .filter((entry) => entry.screeningsToday.length > 0);

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', p: 4 }}>
      <Stack data-testid="day-picker" direction="row" spacing={1} sx={{ mb: 4, alignItems: 'center' }}>
        {dayOptions.map((option) => (
          <Button
            key={option.iso}
            data-testid="day-button"
            data-date={option.iso}
            data-selected={option.iso === selectedDate}
            variant={option.iso === selectedDate ? 'contained' : 'outlined'}
            onClick={() => selectDate(option.iso)}
          >
            {option.label}
          </Button>
        ))}
        <DatePicker
          value={isPresetDate ? null : dayjs(selectedDate, 'YYYY-MM-DD')}
          minDate={dayjs(todayISO(), 'YYYY-MM-DD')}
          onChange={(value: Dayjs | null) => {
            if (value && value.isValid()) selectDate(value.format('YYYY-MM-DD'));
          }}
          slotProps={{ textField: { 'data-testid': 'date-picker', size: 'small' } }}
        />
      </Stack>

      {loading && (
        <Typography data-testid="movies-loading">Loading…</Typography>
      )}

      {!loading && error && (
        <Box data-testid="movies-error">
          <Typography>Failed to load movies</Typography>
          <Button data-testid="movies-retry-button" onClick={() => load(selectedDate)}>
            Retry
          </Button>
        </Box>
      )}

      {!loading && !error && moviesForDay.length === 0 && (
        <Typography data-testid="movies-empty">No screenings on this day</Typography>
      )}

      {!loading && !error && moviesForDay.length > 0 && (
        <Stack data-testid="movie-list" spacing={2}>
          {moviesForDay.map(({ movie, screeningsToday }) => (
            <Card key={movie.id} data-testid="movie-card" data-movie-id={movie.id}>
              <CardContent>
                <Typography data-testid="movie-title" variant="h6">
                  {movie.title}
                </Typography>
                <Typography data-testid="movie-genre">{movie.genre}</Typography>
                <Typography data-testid="movie-runtime">{movie.runtimeMinutes} min</Typography>
                <Typography data-testid="movie-format">{movie.format}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  {screeningsToday.map((screening) => (
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
