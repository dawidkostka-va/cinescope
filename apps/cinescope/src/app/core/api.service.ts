import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
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

  screening(id: string | number) {
    return this.http.get<Screening>(`${BASE_URL}/screenings/${id}`);
  }

  createReservation(request: ReservationRequest) {
    return this.http.post<Reservation>(`${BASE_URL}/reservations`, request);
  }
}
