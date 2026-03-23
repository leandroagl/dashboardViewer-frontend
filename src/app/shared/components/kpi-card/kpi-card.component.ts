// ─── KpiCardComponent ─────────────────────────────────────────────────────────
// Tarjeta compacta para mostrar un valor numérico con etiqueta y estado.

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SensorStatus } from '@core/models';

@Component({
  selector:   'app-kpi-card',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="kpi-card kpi-card--{{ status }}">
      <div class="kpi-card__label">{{ label }}</div>
      <div class="kpi-card__value mono">{{ value }}</div>
      <div class="kpi-card__sub" *ngIf="sublabel">{{ sublabel }}</div>
      <div class="kpi-card__delta" *ngIf="delta != null">
        <span class="kpi-card__delta-arrow">{{ delta >= 0 ? '↑' : '↓' }}</span>
        <span class="kpi-card__delta-val mono">{{ formatDelta(delta!) }}</span>
        <span class="kpi-card__delta-label" *ngIf="deltaLabel">{{ deltaLabel }}</span>
      </div>
    </div>
  `,
  styles: [`
    .kpi-card {
      background: var(--bg-elevated); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md); padding: 12px 14px; min-width: 110px;
      transition: border-color var(--transition);
    }
    .kpi-card__label {
      font-size: 10px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.07em; color: var(--text-muted); margin-bottom: 6px;
    }
    .kpi-card__value { font-size: 22px; font-weight: 700; color: var(--text-primary); line-height: 1; }
    .kpi-card__sub   { font-size: 11px; color: var(--text-secondary); margin-top: 4px; }
    .kpi-card__delta { display: flex; align-items: center; gap: 3px; margin-top: 5px; font-size: 11px; }
    .kpi-card__delta-arrow { font-size: 12px; }
    .kpi-card__delta-val   { color: var(--text-secondary); }
    .kpi-card__delta-label { color: var(--text-muted); }
    .kpi-card--ok      { border-left: 3px solid var(--status-ok);      }
    .kpi-card--warning { border-left: 3px solid var(--status-warning);  }
    .kpi-card--error   { border-left: 3px solid var(--status-error);    }
    .kpi-card--unusual { border-left: 3px solid var(--status-unusual);  }
    .kpi-card--paused  { border-left: 3px solid var(--status-paused);   }
    .kpi-card--unknown { border-left: 3px solid var(--border-default);  }
  `]
})
export class KpiCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string | number;
  @Input() status: SensorStatus = 'unknown';
  @Input() sublabel?: string;
  @Input() delta?: number;
  @Input() deltaLabel?: string;

  protected formatDelta(delta: number): string {
    const abs = Math.abs(delta);
    return abs >= 1 ? abs.toFixed(1) : abs.toFixed(2);
  }
}
