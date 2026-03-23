// ─── DeviceDetailPanelComponent ───────────────────────────────────────────────
// Panel expandible in-place que contiene estadísticas + HistoryChart.
// El padre controla la expansión vía template reference: #detail y (click)="detail.toggle()".

import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';

@Component({
  selector:   'app-device-detail-panel',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="detail-panel" *ngIf="expanded()">
      <div class="detail-panel__header">
        <span class="detail-panel__title">{{ label ?? 'Historial' }}</span>
        <button class="detail-panel__close" mat-icon-button (click)="toggle()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <app-history-chart
        [objid]="objid"
        [slug]="slug"
        [label]="label"
      ></app-history-chart>
    </div>
  `,
  styles: [`
    .detail-panel { background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px 16px; margin-top: 8px; }
    .detail-panel__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .detail-panel__title  { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
    .detail-panel__close  { width: 24px; height: 24px; line-height: 24px; }
    .detail-panel__close mat-icon { font-size: 16px; width: 16px; height: 16px; }
  `],
})
export class DeviceDetailPanelComponent {
  @Input({ required: true }) objid!: number;
  @Input({ required: true }) slug!:  string;
  @Input() label?: string;

  readonly expanded = signal(false);

  toggle(): void { this.expanded.update(v => !v); }
}
