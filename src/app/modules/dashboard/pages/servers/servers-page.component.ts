import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardService } from '@core/services/dashboard.service';
import { VmwareDashboard, VmwareHost, SensorStatus } from '@core/models';
import { BaseDashboardPage } from '../base-dashboard-page';

@Component({
  selector:        'app-servers-page',
  standalone:      false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:     './servers-page.component.html',
  styleUrls:       ['./servers-page.component.scss'],
})
export class ServersPageComponent extends BaseDashboardPage<VmwareDashboard> {
  private readonly service = inject(DashboardService);

  protected clientSlug(): string {
    return this.slug();
  }

  protected fetchData(slug: string): Observable<VmwareDashboard> {
    return this.service.getServers(slug);
  }

  protected readonly expandedHosts = signal<Set<string>>(new Set());

  protected toggleHistory(hostName: string): void {
    this.expandedHosts.update(set => {
      const next = new Set(set);
      if (next.has(hostName)) next.delete(hostName);
      else next.add(hostName);
      return next;
    });
  }

  protected hostsOk(d: VmwareDashboard): number {
    return d.hosts.filter(h => h.status === 'ok').length;
  }
  protected hostsWarn(d: VmwareDashboard): number {
    return d.hosts.filter(h => h.status === 'warning').length;
  }
  protected hostsError(d: VmwareDashboard): number {
    return d.hosts.filter(h => h.status === 'error' || h.status === 'unknown').length;
  }

  protected cpuSparkline(d: VmwareDashboard, host: VmwareHost) {
    return d.sparklines?.[`${host.name}/cpu`];
  }
  protected ramSparkline(d: VmwareDashboard, host: VmwareHost) {
    return d.sparklines?.[`${host.name}/ram`];
  }
  protected diskRSparkline(d: VmwareDashboard, host: VmwareHost) {
    return d.sparklines?.[`${host.name}/diskR`];
  }
  protected diskWSparkline(d: VmwareDashboard, host: VmwareHost) {
    return d.sparklines?.[`${host.name}/diskW`];
  }


  protected hasOldSnapshots(d: VmwareDashboard): boolean {
    return d.hosts.some(h => h.snapshots.some((s: any) => {
      const n = parseInt(s.value, 10);
      return !isNaN(n) && n >= 7;
    }));
  }

  protected totalVms(d: VmwareDashboard): number {
    return d.hosts.reduce((s, h) => s + h.vms.length, 0);
  }

  protected totalSnapshots(d: VmwareDashboard): number {
    return d.hosts.reduce((s, h) => s + h.snapshots.length, 0);
  }

  protected hostAlerts(d: VmwareDashboard, host: VmwareHost) {
    return d.alerts.filter(a => a.name.startsWith(host.name + ' — '));
  }

  protected formatGb(gb: number | null): string {
    if (gb == null) return 'N/A';
    if (gb >= 1024) return (gb / 1024).toFixed(2) + ' TB';
    return gb.toFixed(2) + ' GB';
  }

  protected dsStatusLabel(status: SensorStatus): string {
    switch (status) {
      case 'ok':      return '✓ OK';
      case 'warning': return '⚠ Aviso';
      case 'error':   return '✕ Error';
      default:        return '— N/A';
    }
  }
}
