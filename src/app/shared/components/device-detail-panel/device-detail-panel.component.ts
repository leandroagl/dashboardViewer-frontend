// ─── DeviceDetailPanelComponent ───────────────────────────────────────────────
// Expandable history panel that shows a chart for a given sensor objid.
// Fetches data from the dashboard service using the client slug.

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector:   'app-device-detail-panel',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ddp">
      <div class="ddp__header">
        <mat-icon class="ddp__icon">show_chart</mat-icon>
        <span class="ddp__label">{{ label }}</span>
      </div>
      <div class="ddp__body" *ngIf="objid > 0; else noSensor">
        <app-history-chart
          [objid]="objid"
          [slug]="slug"
          [label]="label"
          [warningThreshold]="warningThreshold"
        ></app-history-chart>
      </div>
      <ng-template #noSensor>
        <p class="ddp__hint ddp__hint--muted">Sin sensor de historial disponible para este host.</p>
      </ng-template>
    </div>
  `,
  styles: [`
    .ddp {
      margin-top: 10px;
      padding: 12px 14px;
      border-radius: var(--radius-sm);
      background: var(--bg-page);
      border: 1px solid var(--border-subtle);
      animation: ddp-slide-in 0.18s ease;
    }
    @keyframes ddp-slide-in {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .ddp__header {
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 8px;
    }
    .ddp__icon  { font-size: 16px; width: 16px; height: 16px; color: var(--primary, var(--color-primary)); }
    .ddp__label { font-size: 12px; font-weight: 600; color: var(--text-primary); }
    .ddp__hint  { font-size: 11px; color: var(--text-secondary); margin: 0; }
    .ddp__hint--muted { color: var(--text-muted); }
  `]
})
export class DeviceDetailPanelComponent {
  @Input({ required: true }) objid!:   number;
  @Input({ required: true }) slug!:    string;
  @Input() label = '';
  @Input() warningThreshold?: number;
}
