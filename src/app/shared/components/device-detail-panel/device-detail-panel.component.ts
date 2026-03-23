// ─── DeviceDetailPanelComponent ───────────────────────────────────────────────
// Expandable history panel that shows a chart for a given sensor objid.
// Fetches data from the dashboard service using the client slug.

import {
  ChangeDetectionStrategy, Component, computed, Input, input, OnChanges, SimpleChanges, signal
} from '@angular/core';

export interface MetricChannel { key: string; label: string; }

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

      <!-- Channel selector (only shown when multiple channels available) -->
      <div class="ddp__channels" *ngIf="channels.length > 1">
        <button
          *ngFor="let ch of channels"
          class="ddp__ch-btn"
          [class.active]="selectedChannel() === ch.key"
          (click)="selectedChannel.set(ch.key)"
        >{{ ch.label }}</button>
      </div>

      <div class="ddp__body" *ngIf="resolvedObjid() > 0; else noSensor">
        <app-history-chart
          [objid]="resolvedObjid()"
          [slug]="slug()"
          [label]="label"
          [channel]="selectedChannel()"
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
    .ddp__channels {
      display: flex; gap: 4px; margin-bottom: 8px; flex-wrap: wrap;
    }
    .ddp__ch-btn {
      font-size: 11px; padding: 2px 10px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
    }
    .ddp__ch-btn.active {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
  `]
})
export class DeviceDetailPanelComponent implements OnChanges {
  readonly objid = input.required<number>();
  readonly slug  = input.required<string>();
  @Input() label = '';
  @Input() warningThreshold?: number;
  @Input() channels: MetricChannel[] = [];
  /** Per-channel objids: when set, overrides the base objid for the active channel. */
  @Input() channelObjids?: Record<string, number>;

  protected readonly selectedChannel = signal('');

  protected readonly resolvedObjid = computed(() => {
    const ch = this.selectedChannel();
    return this.channelObjids?.[ch] ?? this.objid();
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['channels'] && this.channels.length > 0 && !this.selectedChannel()) {
      this.selectedChannel.set(this.channels[0].key);
    }
  }
}
