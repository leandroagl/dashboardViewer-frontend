import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { ApiResponse, User, CreateUserPayload } from '../models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin/users`;

  getAll(filters: { cliente_id?: string; rol?: string; activo?: boolean } = {}): Observable<User[]> {
    let params = new HttpParams();
    if (filters.cliente_id) params = params.set('cliente_id', filters.cliente_id);
    if (filters.rol)        params = params.set('rol', filters.rol);
    if (filters.activo !== undefined) params = params.set('activo', String(filters.activo));
    return this.http.get<ApiResponse<User[]>>(this.base, { params }).pipe(map(r => r.data ?? []));
  }

  create(payload: CreateUserPayload): Observable<User & { plainPassword: string }> {
    return this.http.post<ApiResponse<User & { plainPassword: string }>>(this.base, payload).pipe(map(r => r.data!));
  }

  update(id: string, payload: Partial<CreateUserPayload>): Observable<User> {
    return this.http.patch<ApiResponse<User>>(`${this.base}/${id}`, payload).pipe(map(r => r.data!));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`).pipe(map(() => void 0));
  }

  setStatus(id: string, activo: boolean): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/status`, { activo });
  }

  resetPassword(id: string): Observable<{ plainPassword: string }> {
    return this.http.post<ApiResponse<{ plainPassword: string }>>(`${this.base}/${id}/reset-password`, {})
      .pipe(map(r => r.data!));
  }

  revokeKiosk(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/revoke-kiosk`, {});
  }
}