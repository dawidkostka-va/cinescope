import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import { Movie, Screening } from '../../types';

interface MovieCardProps {
  movie: Movie;
  screenings: Screening[];
}

export function MovieCard({ movie, screenings }: MovieCardProps) {
  const navigate = useNavigate();

  return (
    <Card data-testid="movie-card" data-movie-id={movie.id} sx={{ mb: 2 }}>
      <CardContent>
        <Typography data-testid="movie-title" variant="h6">
          {movie.title}
        </Typography>
        <Typography data-testid="movie-genre" color="text.secondary">
          {movie.genre}
        </Typography>
        <Typography data-testid="movie-runtime">{`${movie.runtimeMinutes} min`}</Typography>
        <Typography data-testid="movie-format">{movie.format}</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
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
  );
}
