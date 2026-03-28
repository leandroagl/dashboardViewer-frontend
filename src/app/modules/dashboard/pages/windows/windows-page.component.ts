import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardService } from '@core/services/dashboard.service';
import { WindowsDashboard, WindowsServer, SensorStatus } from '@core/models';
import { BaseDashboardPage } from '../base-dashboard-page';

@Component({
  selector:        'app-windows-page',
  standalone:      false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:     './windows-page.component.html',
  styleUrls:       ['./windows-page.component.scss'],
})
export class WindowsPageComponent extends BaseDashboardPage<WindowsDashboard> {
  private readonly service = inject(DashboardService);

  protected clientSlug(): string {
    return this.slug();
  }

  protected fetchData(slug: string): Observable<WindowsDashboard> {
    return this.service.getWindows(slug);
  }

  // ─── Helpers para el template ────────────────────────────────────────────────

  protected serversOk(d: WindowsDashboard): number {
    return d.servers.filter(s => s.status === 'ok').length;
  }

  protected serversWarn(d: WindowsDashboard): number {
    return d.servers.filter(s => s.status !== 'ok').length;
  }

  protected formatUptimeAvg(hours: number): string {
    if (!hours) return 'N/A';
    const days = Math.floor(hours / 24);
    const hrs  = Math.floor(hours % 24);
    return days > 0 ? `${days}d ${hrs}h` : `${hrs}h`;
  }

  protected cpuSparkValues(d: WindowsDashboard, srv: WindowsServer): number[] {
    return d.sparklines?.[`${srv.name}/cpu`]?.values ?? [];
  }

  protected ramSparkValues(d: WindowsDashboard, srv: WindowsServer): number[] {
    return d.sparklines?.[`${srv.name}/ram`]?.values ?? [];
  }

  protected diskSparkValues(d: WindowsDashboard, srv: WindowsServer): number[] {
    return d.sparklines?.[`${srv.name}/diskFree`]?.values ?? [];
  }

  protected statusColor(status: SensorStatus): string {
    switch (status) {
      case 'ok':      return 'var(--status-ok)';
      case 'warning': return 'var(--status-warning)';
      case 'error':   return 'var(--status-error)';
      default:        return 'var(--border-subtle)';
    }
  }

  protected alertsStatus(d: WindowsDashboard): SensorStatus {
    return d.alerts.some(a => a.status === 'error') ? 'error'
         : d.alerts.some(a => a.status === 'warning') ? 'warning'
         : 'ok';
  }

  protected parseValue(val: string): number {
    return parseFloat(val) || 0;
  }

  protected serverAlerts(d: WindowsDashboard, srv: WindowsServer) {
    return d.alerts.filter(a => a.name.startsWith(srv.name + ' — '));
  }

  protected okServersOf(d: WindowsDashboard): WindowsServer[] {
    return d.servers.filter(s => s.status === 'ok');
  }

  protected alertingServers(d: WindowsDashboard): WindowsServer[] {
    return [
      ...d.servers.filter(s => s.status === 'error'),
      ...d.servers.filter(s => s.status !== 'error' && s.status !== 'ok'),
    ];
  }

  protected alertingCol1(d: WindowsDashboard): WindowsServer[] {
    return this.alertingServers(d).filter((_, i) => i % 2 === 0);
  }

  protected alertingCol2(d: WindowsDashboard): WindowsServer[] {
    return this.alertingServers(d).filter((_, i) => i % 2 === 1);
  }

  protected readonly expandedServers = signal<Set<string>>(new Set());

  protected toggleHistory(name: string): void {
    this.expandedServers.update(set => {
      const next = new Set(set);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  protected serverObjids(d: WindowsDashboard, srv: WindowsServer): Record<string, number> {
    return {
      cpu:      d.sparklines?.[`${srv.name}/cpu`]?.objid      ?? 0,
      ram:      d.sparklines?.[`${srv.name}/ram`]?.objid      ?? 0,
      diskFree: d.sparklines?.[`${srv.name}/diskFree`]?.objid ?? 0,
    };
  }
}
