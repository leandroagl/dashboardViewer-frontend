import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardService } from '@core/services/dashboard.service';
import { SucursalesDashboard, SensorStatus } from '@core/models';
import { BaseDashboardPage } from '../base-dashboard-page';

@Component({
  selector:        'app-sucursales-page',
  standalone:      false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:     './sucursales-page.component.html',
  styleUrls:       ['./sucursales-page.component.scss'],
})
export class SucursalesPageComponent extends BaseDashboardPage<SucursalesDashboard> {
  private readonly service = inject(DashboardService);

  protected clientSlug(): string {
    return this.slug();
  }

  protected fetchData(slug: string): Observable<SucursalesDashboard> {
    return this.service.getSucursales(slug);
  }

  protected connectivityPct(d: SucursalesDashboard): number {
    if (!d.sucursales.length) return 0;
    return Math.round((d.onlineCount / d.sucursales.length) * 100);
  }

  protected connectivityStatus(d: SucursalesDashboard): SensorStatus {
    const pct = this.connectivityPct(d);
    if (pct === 100) return 'ok';
    if (pct >= 80)   return 'warning';
    return 'error';
  }

  protected offlineStatus(d: SucursalesDashboard): SensorStatus {
    return d.offlineCount > 0 ? 'error' : 'ok';
  }

  protected sucursalIcon(status: SensorStatus): string {
    if (status === 'ok')      return 'location_on';
    if (status === 'warning') return 'wifi_find';
    return 'wifi_off';
  }
}
