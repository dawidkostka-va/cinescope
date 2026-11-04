import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { Movie, Reservation, ReservationRequest, Screening } from './models';

const API_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class CinemaApi {
  private readonly http = inject(HttpClient);

  movies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(`${API_URL}/movies`);
  }

  screeningsOnDate(date: string): Observable<Screening[]> {
    return this.http.get<Screening[]>(`${API_URL}/screenings`, { params: { date } });
  }

  movie(id: number): Observable<Movie> {
    return this.http.get<Movie>(`${API_URL}/movies/${id}`);
  }

  screening(id: number): Observable<Screening> {
    return this.http.get<Screening>(`${API_URL}/screenings/${id}`);
  }

  createReservation(request: ReservationRequest): Observable<Reservation> {
    return this.http.post<Reservation>(`${API_URL}/reservations`, request);
  }

  screeningWithMovie(id: number): Observable<{ screening: Screening; movie: Movie }> {
    return this.screening(id).pipe(
      switchMap((screening) =>
        this.movie(screening.movieId).pipe(map((movie) => ({ screening, movie }))),
      ),
    );
  }
}
