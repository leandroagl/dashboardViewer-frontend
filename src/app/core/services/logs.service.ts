import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { ApiResponse, AuditLog, LogsMeta } from '../models';

export interface LogFilters {
  cliente_id?: string;
  usuario_id?: string;
  accion?:     string;
  resultado?:  string;
  desde?:      string;
  hasta?:      string;
  page?:       number;
}

@Injectable({ providedIn: 'root' })
export class LogsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin/logs`;

  getLogs(filters: LogFilters = {}): Observable<{ logs: AuditLog[]; meta: LogsMeta }> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params = params.set(k, String(v)); });
    return this.http.get<ApiResponse<AuditLog[]> & { meta: LogsMeta }>(this.base, { params })
      .pipe(map(r => ({ logs: r.data ?? [], meta: r.meta as unknown as LogsMeta })));
  }

  getSuspiciousIps(): Observable<{ ip_origen: string; intentos: number; ultimo: string }[]> {
    return this.http.get<ApiResponse<{ ip_origen: string; intentos: number; ultimo: string }[]>>(
      `${this.base}/suspicious-ips`
    ).pipe(map(r => r.data ?? []));
  }

  getExportUrl(filters: Omit<LogFilters, 'page'>): string {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params = params.set(k, String(v)); });
    return `${this.base}/export?${params.toString()}`;
  }
}
