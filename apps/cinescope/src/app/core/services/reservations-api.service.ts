import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Reservation, ReservationRequest } from '../models/api.model';

const BASE_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class ReservationsApiService {
  private readonly http = inject(HttpClient);

  create(request: ReservationRequest): Observable<Reservation> {
    return this.http.post<Reservation>(`${BASE_URL}/reservations`, request);
  }
}
