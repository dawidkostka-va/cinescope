import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Movie, Reservation, ReservationRequest, Screening } from './models';

const BASE_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  movies() {
    return this.http.get<Movie[]>(`${BASE_URL}/movies`);
  }

  movie(id: number) {
    return this.http.get<Movie>(`${BASE_URL}/movies/${id}`);
  }

  screenings() {
    return this.http.get<Screening[]>(`${BASE_URL}/screenings`);
  }

  screening(id: number | string) {
    return this.http.get<Screening>(`${BASE_URL}/screenings/${id}`);
  }

  createReservation(reservation: ReservationRequest) {
    return this.http.post<Reservation>(`${BASE_URL}/reservations`, reservation);
  }
}
