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

  // ─── History panel state (multiple simultaneous) ─────────────────────────────

  readonly expandedDevices = signal<Set<string>>(new Set());

  protected toggleHistory(device: NetworkDevice): void {
    this.expandedDevices.update(set => {
      const next = new Set(set);
      if (next.has(device.name)) next.delete(device.name);
      else next.add(device.name);
      return next;
    });
  }

  protected sensorsAsChannels(device: NetworkDevice): { key: string; label: string }[] {
    return device.sensors.map(s => ({ key: s.name, label: s.name }));
  }

  protected sensorObjids(d: NetworkingDashboard, device: NetworkDevice): Record<string, number> {
    return Object.fromEntries(
      device.sensors.map(s => [s.name, d.sparklines?.[device.name + '/' + s.name]?.objid ?? 0])
    );
  }

  protected firstSensorObjid(d: NetworkingDashboard, device: NetworkDevice): number {
    const first = device.sensors[0]?.name ?? '';
    return d.sparklines?.[device.name + '/' + first]?.objid ?? 0;
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

}
