import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { DashboardService } from '@core/services/dashboard.service';
import { NetworkingDashboard, SensorStatus } from '@core/models';

@Component({
  selector:    'app-networking-page',
  standalone:  false,
  templateUrl: './networking-page.component.html',
  styleUrls:   ['./networking-page.component.scss'],
})
export class NetworkingPageComponent implements OnInit, OnDestroy {
  private readonly route   = inject(ActivatedRoute);
  private readonly service = inject(DashboardService);

  private readonly slug = toSignal(
    this.route.parent!.paramMap.pipe(map(p => p.get('slug') ?? '')),
    { initialValue: '' }
  );

  protected readonly loading = signal(true);
  protected readonly data    = signal<NetworkingDashboard | null>(null);
  protected readonly error   = signal('');

  private refreshInterval?: ReturnType<typeof setInterval>;

  ngOnInit(): void { this.load(); this.refreshInterval = setInterval(() => this.load(), 60_000); }
  ngOnDestroy(): void { clearInterval(this.refreshInterval); }

  private load(): void {
    this.service.getNetworking(this.slug()).subscribe({
      next:  d  => { this.data.set(d); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar el dashboard.'); this.loading.set(false); },
    });
  }

  // ─── Helpers para el template ────────────────────────────────────────────────

  protected devicesErrorCount(d: NetworkingDashboard): number {
    return d.devices.filter(dv => dv.status === 'error').length;
  }

  protected devicesErrorStatus(d: NetworkingDashboard): SensorStatus {
    return d.devices.some(dv => dv.status === 'error') ? 'error' : 'ok';
  }

  protected alertsStatus(d: NetworkingDashboard): SensorStatus {
    return d.alerts.length > 0 ? 'error' : 'ok';
  }

  protected hasDevices(d: NetworkingDashboard): boolean {
    return d.devices.length > 0;
  }
}
