// ─── DashboardService ─────────────────────────────────────────────────────────

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import {
  ApiResponse, DashboardType,
  VmwareDashboard, BackupsDashboard, NetworkingDashboard, WindowsDashboard
} from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  private url(slug: string, path = ''): string {
    return `${environment.apiUrl}/${slug}/dashboards${path}`;
  }

  getAvailable(slug: string): Observable<DashboardType[]> {
    return this.http.get<ApiResponse<{ dashboards: DashboardType[] }>>(this.url(slug))
      .pipe(map(r => r.data?.dashboards ?? []));
  }

  getServers(slug: string): Observable<VmwareDashboard> {
    return this.http.get<ApiResponse<VmwareDashboard>>(this.url(slug, '/servers'))
      .pipe(map(r => r.data!));
  }

  getBackups(slug: string): Observable<BackupsDashboard> {
    return this.http.get<ApiResponse<BackupsDashboard>>(this.url(slug, '/backups'))
      .pipe(map(r => r.data!));
  }

  getNetworking(slug: string): Observable<NetworkingDashboard> {
    return this.http.get<ApiResponse<NetworkingDashboard>>(this.url(slug, '/networking'))
      .pipe(map(r => r.data!));
  }

  getWindows(slug: string): Observable<WindowsDashboard> {
    return this.http.get<ApiResponse<WindowsDashboard>>(this.url(slug, '/windows'))
      .pipe(map(r => r.data!));
  }
}
