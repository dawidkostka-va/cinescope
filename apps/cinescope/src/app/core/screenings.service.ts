import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api';
import { Screening } from './models';

@Injectable({ providedIn: 'root' })
export class ScreeningsService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Screening[]> {
    return this.http.get<Screening[]>(`${API_BASE_URL}/screenings`);
  }

  getById(id: number): Observable<Screening> {
    return this.http.get<Screening>(`${API_BASE_URL}/screenings/${id}`);
  }
}
