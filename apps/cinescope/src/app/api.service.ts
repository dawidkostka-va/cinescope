import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Movie, NewReservation, Reservation, Screening } from './models';

const BASE_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);

  movies() {
    return this.http.get<Movie[]>(`${BASE_URL}/movies`);
  }

  movie(id: number | string) {
    return this.http.get<Movie>(`${BASE_URL}/movies/${encodeURIComponent(id)}`);
  }

  screenings() {
    return this.http.get<Screening[]>(`${BASE_URL}/screenings`);
  }

  screening(id: number | string) {
    return this.http.get<Screening>(`${BASE_URL}/screenings/${encodeURIComponent(id)}`);
  }

  createReservation(reservation: NewReservation) {
    return this.http.post<Reservation>(`${BASE_URL}/reservations`, reservation);
  }
}
