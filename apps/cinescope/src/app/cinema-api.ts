import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Movie, NewReservation, Reservation, Screening } from './models';

const BASE_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class CinemaApi {
  private readonly http = inject(HttpClient);

  getMovies(): Promise<Movie[]> {
    return firstValueFrom(this.http.get<Movie[]>(`${BASE_URL}/movies`));
  }

  getScreeningsOn(date: string): Promise<Screening[]> {
    return firstValueFrom(this.http.get<Screening[]>(`${BASE_URL}/screenings`, { params: { date } }));
  }

  getScreening(id: number): Promise<Screening> {
    return firstValueFrom(this.http.get<Screening>(`${BASE_URL}/screenings/${id}`));
  }

  getMovie(id: number): Promise<Movie> {
    return firstValueFrom(this.http.get<Movie>(`${BASE_URL}/movies/${id}`));
  }

  createReservation(reservation: NewReservation): Promise<Reservation> {
    return firstValueFrom(this.http.post<Reservation>(`${BASE_URL}/reservations`, reservation));
  }
}
