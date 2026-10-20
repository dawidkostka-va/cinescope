import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import type { MovieWithScreenings } from './useMoviesForDate';

export function MovieCard({ movie, screenings }: MovieWithScreenings) {
  const navigate = useNavigate();

  return (
    <Paper
      data-testid="movie-card"
      data-movie-id={movie.id}
      sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}
    >
      <Typography data-testid="movie-title" variant="h6">
        {movie.title}
      </Typography>
      <Typography data-testid="movie-genre">{movie.genre}</Typography>
      <Typography data-testid="movie-runtime">{movie.runtimeMinutes} min</Typography>
      <Typography data-testid="movie-format">{movie.format}</Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
    </Paper>
  );
}
