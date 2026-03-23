import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardService } from '@core/services/dashboard.service';
import { NetworkingDashboard, NetworkDevice, SensorStatus } from '@core/models';
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

  protected clientSlug(): string { return this.slug(); }

  protected fetchData(slug: string): Observable<NetworkingDashboard> {
    return this.service.getNetworking(slug);
  }

  // ─── History panel state ──────────────────────────────────────────────────────

  readonly expandedDevice = signal<string | null>(null);
  readonly expandedSensor = signal<string>('');

  protected toggleHistory(device: NetworkDevice): void {
    if (this.expandedDevice() === device.name) {
      this.expandedDevice.set(null);
      this.expandedSensor.set('');
    } else {
      this.expandedDevice.set(device.name);
      this.expandedSensor.set(device.sensors[0]?.name ?? '');
    }
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

  protected deviceUptime(device: NetworkDevice): string {
    return device.sensors.find(s => s.name.toLowerCase().includes('uptime'))?.value ?? '';
  }

  protected sensorAlert(d: NetworkingDashboard, device: NetworkDevice, sensorName: string) {
    return d.alerts.find(a => a.name === device.name + ' — ' + sensorName) ?? null;
  }

  protected sparklineObjid(d: NetworkingDashboard, device: NetworkDevice, sensorName: string): number {
    return d.sparklines?.[device.name + '/' + sensorName]?.objid ?? 0;
  }
}
