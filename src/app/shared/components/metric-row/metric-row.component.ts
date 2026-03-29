import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { SensorStatus } from '../../../core/models';

@Component({
  selector:   'app-metric-row',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="metric-row">
      <span class="metric-row__name">{{ label }}</span>
      <div class="metric-row__bar-wrap" [class.metric-row__bar-wrap--empty]="pct == null">
        <div *ngIf="pct != null"
          class="metric-row__bar"
          [ngClass]="'metric-row__bar--' + status"
          [style.width.%]="pct"
        ></div>
      </div>
      <span class="metric-row__val mono" [ngClass]="'metric-row__val--' + status">{{ value }}</span>
      <app-sparkline [values]="sparkValues" [color]="sparkColor"></app-sparkline>
    </div>
  `,
  styles: [`
    :host { display: contents; }

    .metric-row {
      display: grid;
      grid-template-columns: var(--metric-row-cols, 80px 1fr 80px 68px);
      align-items: center;
      gap: 8px;
    }
    .metric-row__name {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }
    .metric-row__bar-wrap {
      height: 3px;
      background: var(--bg-page);
      border-radius: 2px;
      overflow: hidden;
    }
    .metric-row__bar-wrap--empty { background: transparent; }

    .metric-row__bar {
      height: 100%;
      border-radius: 2px;
      transition: width 0.3s;
      background: var(--status-ok);
    }
    .metric-row__bar--warning { background: var(--status-warning); }
    .metric-row__bar--error   { background: var(--status-error);   }
    .metric-row__bar--unknown { background: var(--border-subtle);  }

    .metric-row__val {
      font-size: 12px;
      text-align: right;
      color: var(--text-primary);
    }
    .metric-row__val--warning { color: var(--status-warning); }
    .metric-row__val--error   { color: var(--status-error);   }
  `]
})
export class MetricRowComponent {
  @Input() label       = '';
  @Input() value       = '';
  @Input() status: SensorStatus = 'unknown';
  /** Porcentaje de llenado de la barra (0–100). null = sin barra. */
  @Input() pct:        number | null = null;
  @Input() sparkValues: number[] = [];

  get sparkColor(): string {
    switch (this.status) {
      case 'ok':      return 'var(--status-ok)';
      case 'warning': return 'var(--status-warning)';
      case 'error':   return 'var(--status-error)';
      default:        return 'var(--border-subtle)';
    }
  }
}
