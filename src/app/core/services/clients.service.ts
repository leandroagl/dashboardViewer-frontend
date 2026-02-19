import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { ApiResponse, Client } from '../models';

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin/clients`;

  getAll(): Observable<Client[]> {
    return this.http.get<ApiResponse<Client[]>>(this.base).pipe(map(r => r.data ?? []));
  }

  getOne(id: string): Observable<Client> {
    return this.http.get<ApiResponse<Client>>(`${this.base}/${id}`).pipe(map(r => r.data!));
  }

  create(payload: Partial<Client>): Observable<Client> {
    return this.http.post<ApiResponse<Client>>(this.base, payload).pipe(map(r => r.data!));
  }

  update(id: string, payload: Partial<Client>): Observable<Client> {
    return this.http.patch<ApiResponse<Client>>(`${this.base}/${id}`, payload).pipe(map(r => r.data!));
  }

  setStatus(id: string, activo: boolean): Observable<Client> {
    return this.http.patch<ApiResponse<Client>>(`${this.base}/${id}/status`, { activo }).pipe(map(r => r.data!));
  }
}
