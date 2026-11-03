import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { Movie, Reservation, ReservationRequest, Screening } from './models';

const API_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  movies(): Observable<Movie[]> {
    return this.http.get<Movie[]>(`${API_URL}/movies`);
  }

  screeningsOn(date: string): Observable<Screening[]> {
    return this.http.get<Screening[]>(`${API_URL}/screenings`, { params: { date } });
  }

  screeningWithMovie(id: number): Observable<{ screening: Screening; movie: Movie }> {
    return this.http.get<Screening>(`${API_URL}/screenings/${id}`).pipe(
      switchMap((screening) =>
        this.http
          .get<Movie>(`${API_URL}/movies/${screening.movieId}`)
          .pipe(map((movie) => ({ screening, movie }))),
      ),
    );
  }

  reserve(request: ReservationRequest): Observable<Reservation> {
    return this.http.post<Reservation>(`${API_URL}/reservations`, request);
  }
}
