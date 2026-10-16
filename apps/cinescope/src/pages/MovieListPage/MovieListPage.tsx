import Button from '@mui/material/Button';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchMovies, fetchScreenings } from '../../api/client';
import { Movie, Screening } from '../../api/types';
import { resolveSelectedDate } from '../../utils/date';
import DayPicker from './DayPicker';
import MovieCard from './MovieCard';
import './MovieListPage.scss';

type Status = 'loading' | 'error' | 'loaded';

export function MovieListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedDate = useMemo(() => resolveSelectedDate(searchParams.get('date')), [searchParams]);

  const [status, setStatus] = useState<Status>('loading');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);

  const load = useCallback(() => {
    setStatus('loading');
    Promise.all([fetchMovies(), fetchScreenings({ date: selectedDate })])
      .then(([movieList, screeningList]) => {
        setMovies(movieList);
        setScreenings(screeningList);
        setStatus('loaded');
      })
      .catch(() => setStatus('error'));
  }, [selectedDate]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSelectDate(date: string) {
    setSearchParams({ date });
  }

  function handleSelectScreening(screeningId: number) {
    navigate(`/screenings/${screeningId}/seats`);
  }

  const entries = movies
    .map((movie) => ({
      movie,
      screenings: screenings.filter((s) => s.movieId === movie.id).sort((a, b) => a.time.localeCompare(b.time)),
    }))
    .filter((entry) => entry.screenings.length > 0);

  return (
    <div className="movie-list-page">
      <DayPicker selectedDate={selectedDate} onSelect={handleSelectDate} />

      {status === 'loading' && <div data-testid="movies-loading">Loading…</div>}

      {status === 'error' && (
        <>
          <div data-testid="movies-error">Failed to load movies</div>
          <Button data-testid="movies-retry-button" variant="outlined" onClick={load}>
            Retry
          </Button>
        </>
      )}

      {status === 'loaded' && entries.length === 0 && <div data-testid="movies-empty">No screenings on this day</div>}

      {status === 'loaded' && entries.length > 0 && (
        <div className="movie-list" data-testid="movie-list">
          {entries.map(({ movie, screenings: movieScreenings }) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              screenings={movieScreenings}
              onSelectScreening={handleSelectScreening}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MovieListPage;
