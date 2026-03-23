// ─── DashboardService ─────────────────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import {
  ApiResponse, DashboardType,
  VmwareDashboard, BackupsDashboard, NetworkingDashboard, WindowsDashboard,
  SucursalesDashboard, HistoryData, HistoryRange
} from '../models';
import { requireData } from '../utils/api.utils';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  private url(slug: string, path = ''): string {
    return `${environment.apiUrl}/${slug}/dashboards${path}`;
  }

  getAvailable(slug: string): Observable<DashboardType[]> {
    return this.http.get<ApiResponse<{ dashboards: DashboardType[] }>>(this.url(slug))
      .pipe(map(r => {
        if (r.data == null) throw new Error('La respuesta del servidor no contiene datos.');
        return r.data.dashboards ?? [];
      }));
  }

  getServers(slug: string): Observable<VmwareDashboard> {
    return this.http.get<ApiResponse<VmwareDashboard>>(this.url(slug, '/servers'))
      .pipe(map(requireData));
  }

  getBackups(slug: string): Observable<BackupsDashboard> {
    return this.http.get<ApiResponse<BackupsDashboard>>(this.url(slug, '/backups'))
      .pipe(map(requireData));
  }

  getNetworking(slug: string): Observable<NetworkingDashboard> {
    return this.http.get<ApiResponse<NetworkingDashboard>>(this.url(slug, '/networking'))
      .pipe(map(requireData));
  }

  getWindows(slug: string): Observable<WindowsDashboard> {
    return this.http.get<ApiResponse<WindowsDashboard>>(this.url(slug, '/windows'))
      .pipe(map(requireData));
  }

  getSucursales(slug: string): Observable<SucursalesDashboard> {
    return this.http.get<ApiResponse<SucursalesDashboard>>(this.url(slug, '/sucursales'))
      .pipe(map(requireData));
  }

  getHistory(slug: string, objid: number, range: HistoryRange, channel = ''): Observable<HistoryData> {
    const params: Record<string, string> = { objid: String(objid), range };
    if (channel) params['channel'] = channel;
    return this.http.get<ApiResponse<HistoryData>>(
      this.url(slug, '/history'),
      { params }
    ).pipe(map(requireData));
  }
}
