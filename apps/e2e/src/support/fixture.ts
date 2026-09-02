import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export interface Movie {
  id: number;
  title: string;
  genre: string;
  runtimeMinutes: number;
  format: 'PL dubbing' | 'PL subtitles';
}

export interface Screening {
  id: number;
  movieId: number;
  date: string;
  time: string;
  occupiedSeats: string[];
}

interface Database {
  movies: Movie[];
  screenings: Screening[];
}

const database = JSON.parse(
  readFileSync(fileURLToPath(new URL('../db.json', import.meta.url)), 'utf8'),
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

export function screeningsOf(movieId: number): Screening[] {
  return screenings.filter((candidate) => candidate.movieId === movieId);
}

/**
 * Screening 1 is the default subject of the suite: it has occupied seats in rows 3, 6 and
 * 11 and one fully occupied couch, so it exercises availability, the couch rule and two
 * price bands at once.
 */
export const DEFAULT_SCREENING_ID = 1;
