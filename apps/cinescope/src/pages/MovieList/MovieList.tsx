import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import { fetchMovies, fetchScreenings } from '../../api/client';
import type { Movie, Screening } from '../../api/types';
import { DayPicker } from './DayPicker';
import { resolveSelectedDate } from './dayPicker';
import './movie-list.scss';

type LoadState = 'loading' | 'error' | 'loaded';

export function MovieList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDate = resolveSelectedDate(searchParams.get('date'));

  const [state, setState] = useState<LoadState>('loading');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);

  const load = useCallback(() => {
    setState('loading');
    Promise.all([fetchMovies(), fetchScreenings()])
      .then(([loadedMovies, loadedScreenings]) => {
        setMovies(loadedMovies);
        setScreenings(loadedScreenings);
        setState('loaded');
      })
      .catch(() => setState('error'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const screeningsByMovie = new Map<number, Screening[]>();
  for (const screening of screenings) {
    if (screening.date !== selectedDate) continue;
    const list = screeningsByMovie.get(screening.movieId) ?? [];
    list.push(screening);
    screeningsByMovie.set(screening.movieId, list);
  }
  for (const list of screeningsByMovie.values()) {
    list.sort((a, b) => a.time.localeCompare(b.time));
  }

  const moviesToShow = movies.filter((movie) => (screeningsByMovie.get(movie.id)?.length ?? 0) > 0);

  return (
    <div className="movie-list-page">
      <DayPicker
        selectedDate={selectedDate}
        onSelectDate={(iso) => setSearchParams({ date: iso })}
      />

      {state === 'loading' && <div data-testid="movies-loading">Loading…</div>}

      {state === 'error' && (
        <div data-testid="movies-error">
          Failed to load movies
          <Button data-testid="movies-retry-button" onClick={load}>
            Retry
          </Button>
        </div>
      )}

      {state === 'loaded' && moviesToShow.length === 0 && (
        <div data-testid="movies-empty">No screenings on this day</div>
      )}

      {state === 'loaded' && moviesToShow.length > 0 && (
        <div data-testid="movie-list">
          {moviesToShow.map((movie) => (
            <div key={movie.id} className="movie-card" data-testid="movie-card" data-movie-id={movie.id}>
              <div data-testid="movie-title" className="movie-card__title">
                {movie.title}
              </div>
              <div data-testid="movie-genre">{movie.genre}</div>
              <div data-testid="movie-runtime">{movie.runtimeMinutes} min</div>
              <div data-testid="movie-format">{movie.format}</div>
              <div className="movie-card__screenings">
                {(screeningsByMovie.get(movie.id) ?? []).map((screening) => (
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
