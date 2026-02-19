import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { DashboardService } from '@core/services/dashboard.service';
import { VmwareDashboard, VmwareHost, SensorStatus } from '@core/models';

@Component({
  selector:    'app-servers-page',
  standalone:  false,
  templateUrl: './servers-page.component.html',
  styleUrls:   ['./servers-page.component.scss'],
})
export class ServersPageComponent implements OnInit, OnDestroy {
  private readonly route   = inject(ActivatedRoute);
  private readonly service = inject(DashboardService);

  private readonly slug = toSignal(
    this.route.parent!.paramMap.pipe(map(p => p.get('slug') ?? '')),
    { initialValue: '' }
  );

  protected readonly loading = signal(true);
  protected readonly data    = signal<VmwareDashboard | null>(null);
  protected readonly error   = signal('');

  private refreshInterval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.load();
    this.refreshInterval = setInterval(() => this.load(), 60_000);
  }

  ngOnDestroy(): void { clearInterval(this.refreshInterval); }

  private load(): void {
    const slug = this.slug();
    if (!slug) return;
    this.service.getServers(slug).subscribe({
      next:  d  => { this.data.set(d); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar el dashboard.'); this.loading.set(false); },
    });
  }

  // ── Summary counts (sobre todos los hosts) ────────────────────────────────
  protected okCount(d: VmwareDashboard): number {
    return d.hosts.reduce((acc, h) =>
      acc + h.vms.filter(v => v.status === 'ok').length
          + h.datastores.filter(ds => ds.status === 'ok').length, 0);
  }
  protected warnCount(d: VmwareDashboard): number {
    return d.hosts.reduce((acc, h) =>
      acc + h.vms.filter(v => v.status === 'warning').length
          + h.datastores.filter(ds => ds.status === 'warning').length, 0);
  }
  protected errorCount(d: VmwareDashboard): number {
    return d.alerts.filter(a => a.status === 'error').length;
  }
  protected unusualCount(d: VmwareDashboard): number {
    return d.hosts.reduce((acc, h) =>
      acc + h.vms.filter(v => v.status === 'unusual').length, 0);
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

  // ── Contadores por host ───────────────────────────────────────────────────
  protected hostSensorTotal(h: VmwareHost): number { return h.vms.length + h.datastores.length; }
  protected hostSensorOk(h: VmwareHost):    number { return h.vms.filter(v => v.status === 'ok').length    + h.datastores.filter(d => d.status === 'ok').length; }
  protected hostSensorWarn(h: VmwareHost):  number { return h.vms.filter(v => v.status === 'warning').length + h.datastores.filter(d => d.status === 'warning').length; }
  protected hostSensorError(h: VmwareHost): number { return h.vms.filter(v => v.status === 'error').length  + h.datastores.filter(d => d.status === 'error').length; }
  protected hostSensorUnusual(h: VmwareHost): number { return h.vms.filter(v => v.status === 'unusual').length; }

  // ── Helpers ───────────────────────────────────────────────────────────────
  protected datastoreBarColor(status: SensorStatus): string {
    return status === 'ok' ? 'primary' : 'warn';
  }

  protected vmIcon(status: SensorStatus): string {
    return status === 'ok' ? 'check' : status === 'warning' ? 'warning' : 'error';
  }
}
