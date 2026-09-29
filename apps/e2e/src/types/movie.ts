export type MovieFormat = 'PL dubbing' | 'PL subtitles';

export interface Movie {
  id: number;
  title: string;
  genre: string;
  runtimeMinutes: number;
  format: MovieFormat;
}
