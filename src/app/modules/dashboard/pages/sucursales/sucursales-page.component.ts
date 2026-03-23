import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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

  protected readonly selectedSucursal = signal<string | null>(null);

  protected selectSucursal(name: string): void {
    this.selectedSucursal.update(curr => curr === name ? null : name);
  }

  protected latencySparkValues(d: SucursalesDashboard, name: string): number[] {
    return d.sparklines?.[`${name}/latency`]?.values ?? [];
  }

  protected latencyObjid(d: SucursalesDashboard, name: string): number {
    return d.sparklines?.[`${name}/latency`]?.objid ?? 0;
  }

  // Average latency across online sucursales (parses "23.4 ms" style strings)
  protected avgLatency(d: SucursalesDashboard): string {
    const online = d.sucursales.filter(s => s.latency);
    if (!online.length) return 'N/A';
    const avg = online.reduce((sum, s) => {
      return sum + (parseFloat(s.latency ?? '0') || 0);
    }, 0) / online.length;
    return avg.toFixed(1) + ' ms';
  }
}
