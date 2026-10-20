import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api';
import { CreateReservation, Reservation } from './models';

@Injectable({ providedIn: 'root' })
export class ReservationsService {
  private readonly http = inject(HttpClient);

  create(payload: CreateReservation): Observable<Reservation> {
    return this.http.post<Reservation>(`${API_BASE_URL}/reservations`, payload);
  }
}
