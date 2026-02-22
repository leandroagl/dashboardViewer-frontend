import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardService } from '@core/services/dashboard.service';
import { NetworkingDashboard, SensorStatus } from '@core/models';
import { BaseDashboardPage } from '../base-dashboard-page';

@Component({
  selector:        'app-networking-page',
  standalone:      false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:     './networking-page.component.html',
  styleUrls:       ['./networking-page.component.scss'],
})
export class NetworkingPageComponent extends BaseDashboardPage<NetworkingDashboard> {
  private readonly service = inject(DashboardService);

  protected fetchData(slug: string): Observable<NetworkingDashboard> {
    return this.service.getNetworking(slug);
  }

  // ─── Helpers para el template ────────────────────────────────────────────────

  protected totalDevicesCount(d: NetworkingDashboard): number {
    return d.devices.length + d.switches.length + d.ptpAntennas.length;
  }

  protected devicesErrorCount(d: NetworkingDashboard): number {
    return [...d.devices, ...d.switches, ...d.ptpAntennas].filter(dv => dv.status === 'error').length;
  }

  protected devicesErrorStatus(d: NetworkingDashboard): SensorStatus {
    return [...d.devices, ...d.switches, ...d.ptpAntennas].some(dv => dv.status === 'error') ? 'error' : 'ok';
  }

  protected alertsStatus(d: NetworkingDashboard): SensorStatus {
    return d.alerts.length > 0 ? 'warning' : 'ok';
  }
}
