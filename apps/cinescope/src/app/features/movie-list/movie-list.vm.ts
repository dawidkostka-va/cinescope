import { Movie, Screening } from '../../core/models';

export interface ScreeningVm {
  id: number;
  time: string;
}

export interface MovieCardVm {
  movie: Movie;
  screenings: ScreeningVm[];
}

export function buildMovieCards(movies: Movie[], screenings: Screening[]): MovieCardVm[] {
  const screeningsByMovie = new Map<number, Screening[]>();
  for (const screening of screenings) {
    const list = screeningsByMovie.get(screening.movieId) ?? [];
    list.push(screening);
    screeningsByMovie.set(screening.movieId, list);
  }

  const cards: MovieCardVm[] = [];
  for (const movie of movies) {
    const movieScreenings = screeningsByMovie.get(movie.id);
    if (!movieScreenings || movieScreenings.length === 0) continue;
    const sorted = [...movieScreenings].sort((a, b) => a.time.localeCompare(b.time));
    cards.push({ movie, screenings: sorted.map((s) => ({ id: s.id, time: s.time })) });
  }
  return cards;
}
