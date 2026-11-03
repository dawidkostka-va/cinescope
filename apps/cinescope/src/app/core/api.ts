import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

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

export interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface ReservationRequest {
  screeningId: number;
  seats: string[];
  customer: Customer;
  totalPrice: number;
}

export interface Reservation extends ReservationRequest {
  id: number;
}

const BASE_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);

  movies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(`${BASE_URL}/movies`);
  }

  movie(id: number): Observable<Movie> {
    return this.http.get<Movie>(`${BASE_URL}/movies/${id}`);
  }

  screenings(): Observable<Screening[]> {
    return this.http.get<Screening[]>(`${BASE_URL}/screenings`);
  }

  screening(id: number): Observable<Screening> {
    return this.http.get<Screening>(`${BASE_URL}/screenings/${id}`);
  }

  createReservation(request: ReservationRequest): Observable<Reservation> {
    return this.http.post<Reservation>(`${BASE_URL}/reservations`, request);
  }
}

export function parseId(value: string | null): number | null {
  return value !== null && /^\d+$/.test(value) ? Number(value) : null;
}
