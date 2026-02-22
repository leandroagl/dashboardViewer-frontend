import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardService } from '@core/services/dashboard.service';
import { BackupDevice, BackupJob, BackupsDashboard, SensorStatus } from '@core/models';
import { BaseDashboardPage } from '../base-dashboard-page';

@Component({
  selector:        'app-backups-page',
  standalone:      false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:     './backups-page.component.html',
  styleUrls:       ['./backups-page.component.scss'],
})
export class BackupsPageComponent extends BaseDashboardPage<BackupsDashboard> {
  private readonly service = inject(DashboardService);

  protected fetchData(slug: string): Observable<BackupsDashboard> {
    return this.service.getBackups(slug);
  }

  // ─── Helpers para el template ────────────────────────────────────────────────

  protected rateStatus(rate: number): SensorStatus {
    if (rate >= 90) return 'ok';
    if (rate >= 70) return 'warning';
    return 'error';
  }

  protected jobsErrorCount(d: BackupsDashboard): number {
    return d.devices
      .flatMap(dev => dev.jobs)
      .filter(j => j.lastStatus === 'error').length;
  }

  protected jobsErrorStatus(d: BackupsDashboard): SensorStatus {
    return this.jobsErrorCount(d) > 0 ? 'error' : 'ok';
  }

  protected veeamDevices(d: BackupsDashboard): BackupDevice[] {
    return d.devices.filter(dev => dev.type === 'veeam');
  }

  protected nasDevices(d: BackupsDashboard): BackupDevice[] {
    return d.devices.filter(dev => dev.type === 'qnap' || dev.type === 'other');
  }

  protected nasIcon(sensorName: string): string {
    if (/disk|storage|space|volume|drive/i.test(sensorName)) return 'storage';
    if (/cpu|processor/i.test(sensorName))                   return 'memory';
    if (/mem|memory|ram/i.test(sensorName))                  return 'memory';
    if (/temp|thermal/i.test(sensorName))                    return 'thermostat';
    if (/fan/i.test(sensorName))                             return 'air';
    if (/ups|battery/i.test(sensorName))                     return 'battery_charging_full';
    if (/network|traffic|eth|wan|lan/i.test(sensorName))     return 'router';
    if (/raid/i.test(sensorName))                            return 'dns';
    if (/ping|latency/i.test(sensorName))                    return 'network_check';
    return 'sensors';
  }

  protected isLogicalDisk(name: string): boolean {
    return /logical.?disk|disk.?free/i.test(name);
  }

  protected nasLogicalDisks(jobs: BackupJob[]): BackupJob[] {
    return jobs.filter(j => this.isLogicalDisk(j.name));
  }

  protected nasOtherSensors(jobs: BackupJob[]): BackupJob[] {
    return jobs.filter(j => !this.isLogicalDisk(j.name));
  }

  protected parseFreePct(value: string): number {
    const m = value.match(/(\d+(?:[.,]\d+)?)/);
    return m ? parseFloat(m[1].replace(',', '.')) : 0;
  }

  protected datastoreBarColor(status: SensorStatus): string {
    return status === 'ok' ? 'primary' : 'warn';
  }
}
