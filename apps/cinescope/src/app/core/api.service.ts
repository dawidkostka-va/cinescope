import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Movie, Reservation, Screening } from './models';

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

  screeningsOn(date: string) {
    return this.http.get<Screening[]>(`${BASE_URL}/screenings`, { params: { date } });
  }

  screening(id: number) {
    return this.http.get<Screening>(`${BASE_URL}/screenings/${id}`);
  }

  createReservation(body: Omit<Reservation, 'id'>) {
    return this.http.post<Reservation>(`${BASE_URL}/reservations`, body);
  }
}
