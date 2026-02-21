import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardService } from '@core/services/dashboard.service';
import { BackupsDashboard, SensorStatus } from '@core/models';
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
    const count = this.jobsErrorCount(d);
    return count === 0 ? 'ok' : count <= 2 ? 'warning' : 'error';
  }
}
