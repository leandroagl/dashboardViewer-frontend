import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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

  // ─── HA / traffic chart helpers ──────────────────────────────────────────────

  /** True when any router device has "MASTER" in its name → HA configuration. */
  protected isHaConfig(d: NetworkingDashboard): boolean {
    return d.devices.some(dev => /master/i.test(dev.name));
  }

  /** All router devices get a chart; in HA configs MASTER is listed first. */
  protected chartDevices(d: NetworkingDashboard): NetworkDevice[] {
    if (!this.isHaConfig(d)) return d.devices;
    return [...d.devices].sort((a, b) =>
      (/master/i.test(a.name) ? 0 : 1) - (/master/i.test(b.name) ? 0 : 1)
    );
  }

  /** Badge label for a device in HA config ('MASTER' | 'BACKUP' | null). */
  protected haRole(d: NetworkingDashboard, device: NetworkDevice): 'MASTER' | 'BACKUP' | null {
    if (!this.isHaConfig(d)) return null;
    return /master/i.test(device.name) ? 'MASTER' : 'BACKUP';
  }

  /**
   * Traffic sensors of a device (value contains "bit" → MBit/s sensors).
   * Falls back to all non-uptime sensors if no traffic sensor is detected.
   */
  protected trafficSensors(device: NetworkDevice): { key: string; label: string }[] {
    const traffic = device.sensors
      .filter(s => (s.value ?? '').toLowerCase().includes('bit'))
      .map(s => ({ key: s.name, label: s.name }));

    if (traffic.length > 0) return traffic;

    return device.sensors
      .filter(s => !s.name.toLowerCase().includes('uptime'))
      .map(s => ({ key: s.name, label: s.name }));
  }

  protected trafficFirstObjid(d: NetworkingDashboard, device: NetworkDevice): number {
    const first = this.trafficSensors(device)[0]?.key ?? '';
    return d.sparklines?.[device.name + '/' + first]?.objid ?? 0;
  }

  protected trafficSensorObjids(d: NetworkingDashboard, device: NetworkDevice): Record<string, number> {
    return Object.fromEntries(
      this.trafficSensors(device).map(s => [s.key, d.sparklines?.[device.name + '/' + s.key]?.objid ?? 0])
    );
  }

  protected trafficChannelUnits(device: NetworkDevice): Record<string, string> {
    return Object.fromEntries(
      this.trafficSensors(device).map(s => [s.key, 'MBit/s'])
    );
  }

  protected trafficBackendChannels(device: NetworkDevice): Record<string, string> {
    return Object.fromEntries(
      this.trafficSensors(device).map(s => [s.key, 'traffic'])
    );
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
