import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { ApiResponse, Client } from '../models';
import { requireData } from '../utils/api.utils';

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin/clients`;

  getAll(): Observable<Client[]> {
    return this.http.get<ApiResponse<Client[]>>(this.base).pipe(map(r => r.data ?? []));
  }

  getOne(id: string): Observable<Client> {
    return this.http.get<ApiResponse<Client>>(`${this.base}/${id}`).pipe(map(requireData));
  }

  create(payload: Partial<Client>): Observable<Client> {
    return this.http.post<ApiResponse<Client>>(this.base, payload).pipe(map(requireData));
  }

  update(id: string, payload: Partial<Client>): Observable<Client> {
    return this.http.patch<ApiResponse<Client>>(`${this.base}/${id}`, payload).pipe(map(requireData));
  }

  setStatus(id: string, activo: boolean): Observable<Client> {
    return this.http.patch<ApiResponse<Client>>(`${this.base}/${id}/status`, { activo }).pipe(map(requireData));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`).pipe(map(() => void 0));
  }
}
