import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Movie, Reservation, ReservationRequest, Screening } from './models';

const BASE_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  getMovies(): Promise<Movie[]> {
    return firstValueFrom(this.http.get<Movie[]>(`${BASE_URL}/movies`));
  }

  getMovie(id: number): Promise<Movie> {
    return firstValueFrom(this.http.get<Movie>(`${BASE_URL}/movies/${id}`));
  }

  getScreenings(): Promise<Screening[]> {
    return firstValueFrom(this.http.get<Screening[]>(`${BASE_URL}/screenings`));
  }

  getScreening(id: string | number): Promise<Screening> {
    return firstValueFrom(this.http.get<Screening>(`${BASE_URL}/screenings/${encodeURIComponent(id)}`));
  }

  createReservation(request: ReservationRequest): Promise<Reservation> {
    return firstValueFrom(this.http.post<Reservation>(`${BASE_URL}/reservations`, request));
  }
}
