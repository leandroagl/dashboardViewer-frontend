import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardService } from '@core/services/dashboard.service';
import { WindowsDashboard, SensorStatus } from '@core/models';
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

  protected fetchData(slug: string): Observable<WindowsDashboard> {
    return this.service.getWindows(slug);
  }

  protected parseValue(str: string): number {
    return parseFloat(str) || 0;
  }

  // ─── Helpers para el template ────────────────────────────────────────────────

  protected alertsStatus(d: WindowsDashboard): SensorStatus {
    return d.alerts.length > 0 ? 'error' : 'ok';
  }
}
