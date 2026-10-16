import Button from '@mui/material/Button';
import { Movie, Screening } from '../../api/types';

interface Props {
  movie: Movie;
  screenings: Screening[];
  onSelectScreening: (screeningId: number) => void;
}

export function MovieCard({ movie, screenings, onSelectScreening }: Props) {
  return (
    <div className="movie-card" data-testid="movie-card" data-movie-id={movie.id}>
      <div className="movie-card__title" data-testid="movie-title">
        {movie.title}
      </div>
      <div data-testid="movie-genre">{movie.genre}</div>
      <div data-testid="movie-runtime">{movie.runtimeMinutes} min</div>
      <div data-testid="movie-format">{movie.format}</div>
      <div className="movie-card__screenings">
        {screenings.map((screening) => (
          <Button
            key={screening.id}
            data-testid="screening-button"
            data-screening-id={screening.id}
            variant="outlined"
            onClick={() => onSelectScreening(screening.id)}
          >
            {screening.time}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default MovieCard;
