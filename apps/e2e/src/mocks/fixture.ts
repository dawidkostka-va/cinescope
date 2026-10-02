import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Movie, Screening } from '../types/index.js';

interface Database {
  movies: Movie[];
  screenings: Screening[];
}

/** Copy of the workspace `db.json`; `global-setup.ts` refuses to run the suite if they differ. */
const database = JSON.parse(
  readFileSync(fileURLToPath(new URL('./db.json', import.meta.url)), 'utf8'),
) as Database;

export const movies = database.movies;
export const screenings = database.screenings;

export function screening(id: number): Screening {
  const found = screenings.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`No screening ${String(id)} in the fixture`);
  return found;
}

export function movieOf(target: Screening): Movie {
  const found = movies.find((candidate) => candidate.id === target.movieId);
  if (!found) throw new Error(`No movie ${String(target.movieId)} in the fixture`);
  return found;
}

/** Screenings of one movie on one day, ordered by time — the order the cards must use. */
export function screeningsOn(date: string, movieId?: number): Screening[] {
  return screenings
    .filter((candidate) => candidate.date === date)
    .filter((candidate) => movieId === undefined || candidate.movieId === movieId)
    .sort((a, b) => a.time.localeCompare(b.time));
}

/** Movies with at least one screening on the day, in backend order. */
export function moviesOn(date: string): Movie[] {
  return movies.filter((movie) => screeningsOn(date, movie.id).length > 0);
}

/**
 * Screening 1 is the default subject of the suite: it has occupied seats in rows 3, 6 and
 * 11 and one fully occupied couch, so it exercises availability, the couch rule and two
 * price bands at once. Row 7 is entirely free.
 */
export const DEFAULT_SCREENING_ID = 1;
