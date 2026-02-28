import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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

  protected fetchData(slug: string): Observable<VmwareDashboard> {
    return this.service.getServers(slug);
  }

  // ── Todos los estados sensor del host (CPU, RAM, disco, VMs, snapshots, datastores) ──
  private hostAllStatuses(h: VmwareHost): SensorStatus[] {
    return [
      h.cpu.status, h.memory.status, h.disk.read.status, h.disk.write.status,
      ...h.vms.map(v => v.status),
      ...h.snapshots.map(s => s.status),
      ...h.datastores.map(ds => ds.status),
    ];
  }

  // ── Summary counts (sobre todos los hosts) ────────────────────────────────
  protected okCount(d: VmwareDashboard): number {
    return d.hosts.reduce((acc, h) => acc + this.hostAllStatuses(h).filter(s => s === 'ok').length, 0);
  }
  protected warnCount(d: VmwareDashboard): number {
    return d.hosts.reduce((acc, h) => acc + this.hostAllStatuses(h).filter(s => s === 'warning').length, 0);
  }
  protected errorCount(d: VmwareDashboard): number {
    return d.hosts.reduce((acc, h) => acc + this.hostAllStatuses(h).filter(s => s === 'error').length, 0);
  }
  // ── Donut SVG math (r=38, circunferencia ≈ 238.8) ─────────────────────────
  protected donutArc(count: number, total: number): string {
    if (total === 0) return '0 239';
    const circ = 2 * Math.PI * 38;
    const arc  = (count / total) * circ;
    return `${arc.toFixed(1)} ${(circ - arc).toFixed(1)}`;
  }

  protected donutOffset(preceding: number, total: number): string {
    if (total === 0) return '0';
    const circ   = 2 * Math.PI * 38;
    const offset = -(preceding / total) * circ;
    return offset.toFixed(1);
  }

  // ── Contadores por host (donut) ───────────────────────────────────────────
  protected hostSensorTotal(h: VmwareHost):   number { return this.hostAllStatuses(h).length; }
  protected hostSensorOk(h: VmwareHost):      number { return this.hostAllStatuses(h).filter(s => s === 'ok').length; }
  protected hostSensorWarn(h: VmwareHost):    number { return this.hostAllStatuses(h).filter(s => s === 'warning').length; }
  protected hostSensorError(h: VmwareHost):   number { return this.hostAllStatuses(h).filter(s => s === 'error').length; }

  // ── Helpers ───────────────────────────────────────────────────────────────
  protected datastoreBarColor(status: SensorStatus): string {
    return status === 'ok' ? 'primary' : 'warn';
  }

  protected vmIcon(status: SensorStatus): string {
    return status === 'ok' ? 'check' : status === 'warning' ? 'warning' : 'error';
  }

  protected formatGb(gb: number): string {
    if (gb >= 1024) return (gb / 1024).toFixed(1) + ' TB';
    return Math.round(gb) + ' GB';
  }
}
