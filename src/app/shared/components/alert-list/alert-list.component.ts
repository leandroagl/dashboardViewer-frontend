// ─── AlertListComponent ───────────────────────────────────────────────────────
// Lista compacta de alertas activas.

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SensorStatus } from '@core/models';

export interface AlertItem {
  name:    string;
  message: string;
  status?: SensorStatus;
}

@Component({
  selector:   'app-alert-list',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="alert-list">
      <div *ngIf="alerts.length === 0" class="alert-list__empty">
        <mat-icon>check_circle</mat-icon>
        <span>Sin alertas activas</span>
      </div>
      <div
        *ngFor="let alert of alerts"
        class="alert-list__item alert-list__item--{{ alert.status || 'error' }}"
      >
        <mat-icon class="alert-list__icon">warning</mat-icon>
        <div class="alert-list__content">
          <div class="alert-list__name">{{ alert.name }}</div>
          <div class="alert-list__msg">{{ alert.message | stripHtml }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .alert-list { display: flex; flex-direction: column; gap: 6px; }
    .alert-list__empty { display: flex; align-items: center; gap: 8px; color: var(--status-ok); font-size: 13px; padding: 8px 0; }
    .alert-list__empty mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .alert-list__item { display: flex; align-items: flex-start; gap: 8px; padding: 8px 10px; border-radius: var(--radius-sm); background: var(--status-error-dim); border-left: 2px solid var(--status-error); }
    .alert-list__item--warning { background: var(--status-warning-dim); border-color: var(--status-warning); }
    .alert-list__item--warning .alert-list__icon { color: var(--status-warning); }
    .alert-list__icon { color: var(--status-error); font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
    .alert-list__name { font-size: 12px; font-weight: 500; color: var(--text-primary); }
    .alert-list__msg  { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
  `]
})
export class AlertListComponent {
  @Input({ required: true }) alerts!: AlertItem[];
}
