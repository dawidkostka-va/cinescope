import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useSearchParams } from 'react-router-dom';
import { resolveSelectedDate } from '../../domain/dateUtils';
import { DayPicker } from './DayPicker';
import { MovieCard } from './MovieCard';
import { useMoviesForDate } from './useMoviesForDate';

export function MovieListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedIso = resolveSelectedDate(searchParams.get('date'));
  const { state, retry } = useMoviesForDate(selectedIso);

  const handleSelectDate = (iso: string) => {
    setSearchParams({ date: iso });
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <DayPicker selectedIso={selectedIso} onSelect={handleSelectDate} />

      {state.status === 'loading' && <Typography data-testid="movies-loading">Loading…</Typography>}

      {state.status === 'error' && (
        <Box data-testid="movies-error" sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
          <Typography>Failed to load movies</Typography>
          <Button data-testid="movies-retry-button" variant="contained" onClick={retry}>
            Retry
          </Button>
        </Box>
      )}

      {state.status === 'success' && state.movies.length === 0 && (
        <Typography data-testid="movies-empty">No screenings on this day</Typography>
      )}

      {state.status === 'success' && state.movies.length > 0 && (
        <Box data-testid="movie-list" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {state.movies.map(({ movie, screenings }) => (
            <MovieCard key={movie.id} movie={movie} screenings={screenings} />
          ))}
        </Box>
      )}
    </Box>
  );
}
