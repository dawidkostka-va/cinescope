import { useEffect, useState } from 'react';
import { fetchMovies, fetchScreeningsByDate } from '../../api/client';
import type { Movie, Screening } from '../../api/types';

export interface MovieWithScreenings {
  movie: Movie;
  screenings: Screening[];
}

type MoviesState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; movies: MovieWithScreenings[] };

export function useMoviesForDate(date: string): { state: MoviesState; retry: () => void } {
  const [state, setState] = useState<MoviesState>({ status: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    (async () => {
      try {
        const [movies, screenings] = await Promise.all([fetchMovies(), fetchScreeningsByDate(date)]);
        if (cancelled) {
          return;
        }
        const screeningsByMovie = new Map<number, Screening[]>();
        for (const screening of screenings) {
          const list = screeningsByMovie.get(screening.movieId) ?? [];
          list.push(screening);
          screeningsByMovie.set(screening.movieId, list);
        }
        for (const list of screeningsByMovie.values()) {
          list.sort((a, b) => a.time.localeCompare(b.time));
        }
        const movieWithScreenings = movies
          .filter((movie) => screeningsByMovie.has(movie.id))
          .map((movie) => ({ movie, screenings: screeningsByMovie.get(movie.id) ?? [] }));
        setState({ status: 'success', movies: movieWithScreenings });
      } catch {
        if (!cancelled) {
          setState({ status: 'error' });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [date, reloadToken]);

  return { state, retry: () => setReloadToken((token) => token + 1) };
}
