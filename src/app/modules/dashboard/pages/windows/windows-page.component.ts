import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { DashboardService } from '@core/services/dashboard.service';
import { WindowsDashboard, SensorStatus } from '@core/models';

@Component({
  selector:    'app-windows-page',
  standalone:  false,
  templateUrl: './windows-page.component.html',
  styleUrls:   ['./windows-page.component.scss'],
})
export class WindowsPageComponent implements OnInit, OnDestroy {
  private readonly route   = inject(ActivatedRoute);
  private readonly service = inject(DashboardService);

  private readonly slug = toSignal(
    this.route.parent!.paramMap.pipe(map(p => p.get('slug') ?? '')),
    { initialValue: '' }
  );

  protected readonly loading = signal(true);
  protected readonly data    = signal<WindowsDashboard | null>(null);
  protected readonly error   = signal('');

  private refreshInterval?: ReturnType<typeof setInterval>;

  ngOnInit(): void { this.load(); this.refreshInterval = setInterval(() => this.load(), 60_000); }
  ngOnDestroy(): void { clearInterval(this.refreshInterval); }

  private load(): void {
    this.service.getWindows(this.slug()).subscribe({
      next:  d  => { this.data.set(d); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar el dashboard.'); this.loading.set(false); },
    });
  }

  protected parseValue(str: string): number {
    return parseFloat(str) || 0;
  }

  // ─── Helpers para el template ────────────────────────────────────────────────

  protected alertsStatus(d: WindowsDashboard): SensorStatus {
    return d.alerts.length > 0 ? 'error' : 'ok';
  }
}
