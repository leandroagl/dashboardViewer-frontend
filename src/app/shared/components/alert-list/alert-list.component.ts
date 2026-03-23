// ─── AlertListComponent ───────────────────────────────────────────────────────
// Lista compacta de alertas activas.

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SensorStatus } from '@core/models';

export interface AlertItem {
  name:       string;
  message:    string;
  status?:    SensorStatus;
  timestamp?: string; // ISO 8601 — optional, only shown if present
}

@Component({
  selector:   'app-alert-list',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="alert-list">
      <div class="alert-list__header" *ngIf="alerts.length > 0">
        <span class="alert-list__title">Alertas</span>
        <span class="alert-list__badge alert-list__badge--{{ worstStatus }}">{{ alerts.length }}</span>
      </div>
      <div *ngIf="alerts.length === 0" class="alert-list__empty">
        <mat-icon>check_circle</mat-icon>
        <span>Sin alertas activas</span>
      </div>
      <div *ngFor="let alert of alerts" class="alert-list__item">
        <div class="alert-list__severity alert-list__severity--{{ alert.status || 'error' }}"></div>
        <div class="alert-list__content">
          <div class="alert-list__name">{{ alert.name }}</div>
          <div class="alert-list__msg">{{ alert.message | stripHtml }}</div>
        </div>
        <div class="alert-list__time" *ngIf="alert.timestamp">{{ relativeTime(alert.timestamp) }}</div>
      </div>
    </div>
  `,
  styles: [`
    .alert-list { display: flex; flex-direction: column; gap: 4px; }
    .alert-list__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .alert-list__title  { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); }
    .alert-list__badge  { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 10px; background: var(--status-error); color: #fff; }
    .alert-list__badge--warning { background: var(--status-warning); }
    .alert-list__empty  { display: flex; align-items: center; gap: 8px; color: var(--status-ok); font-size: 13px; padding: 8px 0; }
    .alert-list__empty mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .alert-list__item   { display: flex; align-items: stretch; gap: 0; padding: 8px 10px; border-radius: var(--radius-sm); background: var(--bg-elevated); }
    .alert-list__severity { width: 3px; border-radius: 2px; flex-shrink: 0; margin-right: 10px; background: var(--status-error); }
    .alert-list__severity--warning { background: var(--status-warning);  }
    .alert-list__severity--unusual { background: var(--status-unusual);  }
    .alert-list__severity--error   { background: var(--status-error);    }
    .alert-list__content { flex: 1; min-width: 0; }
    .alert-list__name { font-size: 12px; font-weight: 500; color: var(--text-primary); }
    .alert-list__msg  { font-size: 11px; color: var(--text-secondary); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .alert-list__time { font-size: 10px; color: var(--text-muted); white-space: nowrap; flex-shrink: 0; margin-left: 8px; margin-top: 1px; }
  `]
})
export class AlertListComponent {
  @Input({ required: true }) alerts!: AlertItem[];

  protected get worstStatus(): SensorStatus {
    if (this.alerts.some(a => a.status === 'error'))   return 'error';
    if (this.alerts.some(a => a.status === 'warning'))  return 'warning';
    if (this.alerts.some(a => a.status === 'unusual'))  return 'unusual';
    return 'error';
  }

  protected relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins  = Math.floor(diff / 60_000);
    if (mins < 1)    return 'hace un momento';
    if (mins < 60)   return `hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24)  return `hace ${hours} h`;
    const days  = Math.floor(hours / 24);
    return `hace ${days}d`;
  }
}
