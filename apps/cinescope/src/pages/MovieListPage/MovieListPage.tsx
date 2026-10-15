import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import { fetchMovies, fetchScreenings } from '../../api/client';
import { Movie, Screening } from '../../api/types';
import { ISO_DATE_FORMAT, parseIsoDate, today } from '../../utils/date';
import { DayButtonOption, DayPicker } from '../../components/DayPicker/DayPicker';
import styles from './MovieListPage.module.scss';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; movies: Movie[]; screenings: Screening[] };

export function MovieListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const load = useCallback(() => {
    setState({ status: 'loading' });
    Promise.all([fetchMovies(), fetchScreenings()])
      .then(([movies, screenings]) => setState({ status: 'loaded', movies, screenings }))
      .catch(() => setState({ status: 'error' }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const todayDate = useMemo(() => today(), []);
  const todayStr = todayDate.format(ISO_DATE_FORMAT);

  const dayButtons: DayButtonOption[] = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const date = todayDate.add(i, 'day');
        return {
          value: date.format(ISO_DATE_FORMAT),
          label: i === 0 ? 'Today' : date.format('dddd'),
        };
      }),
    [todayDate],
  );

  const dateParam = searchParams.get('date');
  const parsedDate = parseIsoDate(dateParam);
  const selectedDateStr =
    parsedDate && !parsedDate.isBefore(todayDate, 'day') ? parsedDate.format(ISO_DATE_FORMAT) : todayStr;

  const selectedButton = dayButtons.find((d) => d.value === selectedDateStr) ?? null;

  const selectDate = (value: string) => {
    setSearchParams({ date: value });
  };

  const movieCards = useMemo(() => {
    if (state.status !== 'loaded') return [];
    const screeningsForDate = state.screenings.filter((s) => s.date === selectedDateStr);
    return state.movies
      .map((movie) => ({
        movie,
        screenings: screeningsForDate
          .filter((s) => s.movieId === movie.id)
          .sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((entry) => entry.screenings.length > 0);
  }, [state, selectedDateStr]);

  return (
    <div className={styles.page}>
      <DayPicker
        dayButtons={dayButtons}
        selectedButtonValue={selectedButton ? selectedDateStr : null}
        datePickerValue={selectedButton ? null : dayjs(selectedDateStr)}
        minDate={todayDate}
        onSelectDay={selectDate}
        onSelectDate={(value) => selectDate(value.format(ISO_DATE_FORMAT))}
      />

      {state.status === 'loading' && (
        <Typography data-testid="movies-loading" sx={{ mt: 3 }}>
          Loading…
        </Typography>
      )}

      {state.status === 'error' && (
        <div>
          <Typography data-testid="movies-error" sx={{ mt: 3 }}>
            Failed to load movies
          </Typography>
          <Button data-testid="movies-retry-button" onClick={load} sx={{ mt: 1 }}>
            Retry
          </Button>
        </div>
      )}

      {state.status === 'loaded' && movieCards.length === 0 && (
        <Typography data-testid="movies-empty" sx={{ mt: 3 }}>
          No screenings on this day
        </Typography>
      )}

      {state.status === 'loaded' && movieCards.length > 0 && (
        <div className={styles.movieList} data-testid="movie-list">
          {movieCards.map(({ movie, screenings }) => (
            <div key={movie.id} className={styles.movieCard} data-testid="movie-card" data-movie-id={movie.id}>
              <Typography variant="h6" data-testid="movie-title">
                {movie.title}
              </Typography>
              <div className={styles.movieMeta}>
                <span data-testid="movie-genre">{movie.genre}</span>
                <span data-testid="movie-runtime">{movie.runtimeMinutes} min</span>
                <span data-testid="movie-format">{movie.format}</span>
              </div>
              <div className={styles.screeningButtons}>
                {screenings.map((screening) => (
                  <Button
                    key={screening.id}
                    variant="outlined"
                    data-testid="screening-button"
                    data-screening-id={screening.id}
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
