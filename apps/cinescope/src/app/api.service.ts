import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, map } from 'rxjs';
import { Movie, NewReservation, Reservation, Screening, ScreeningDetails } from './models';

const BASE_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  getMovies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(`${BASE_URL}/movies`);
  }

  getMovie(id: number): Observable<Movie> {
    return this.http.get<Movie>(`${BASE_URL}/movies/${id}`);
  }

  getScreenings(date: string): Observable<Screening[]> {
    return this.http.get<Screening[]>(`${BASE_URL}/screenings`, { params: { date } });
  }

  getScreening(id: number): Observable<Screening> {
    return this.http.get<Screening>(`${BASE_URL}/screenings/${id}`);
  }

  getScreeningDetails(id: number): Observable<ScreeningDetails> {
    return this.getScreening(id).pipe(
      switchMap((screening) =>
        this.getMovie(screening.movieId).pipe(map((movie): ScreeningDetails => ({ screening, movie }))),
      ),
    );
  }

  createReservation(reservation: NewReservation): Observable<Reservation> {
    return this.http.post<Reservation>(`${BASE_URL}/reservations`, reservation);
  }
}
