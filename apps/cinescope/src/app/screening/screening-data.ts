import { computed, Signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { API_URL } from '../api';
import { Movie, Screening } from '../models';

export function loadScreeningWithMovie(id: Signal<string | null>) {
  const screeningResource = httpResource<Screening>(() => `${API_URL}/screenings/${id()}`);
  const movieResource = httpResource<Movie>(() => {
    const screening = screeningResource.value();
    return screening ? `${API_URL}/movies/${screening.movieId}` : undefined;
  });

  return {
    screening: computed(() => (movieResource.hasValue() ? screeningResource.value() : undefined)),
    movie: computed(() => (movieResource.hasValue() ? movieResource.value() : undefined)),
    failed: computed(() => !!screeningResource.error() || !!movieResource.error()),
  };
}
