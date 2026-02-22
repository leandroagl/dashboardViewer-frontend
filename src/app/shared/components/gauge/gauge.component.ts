// ─── GaugeComponent ───────────────────────────────────────────────────────────
// Gauge semicircular SVG para CPU, RAM, uso de disco, etc.

import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { SensorStatus } from '@core/models';

@Component({
  selector:   'app-gauge',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="gauge">
      <svg viewBox="0 0 120 70" class="gauge__svg">
        <!-- Track -->
        <path
          d="M 10 65 A 50 50 0 0 1 110 65"
          fill="none"
          stroke="var(--bg-hover)"
          stroke-width="10"
          stroke-linecap="round"
        />
        <!-- Fill -->
        <path
          d="M 10 65 A 50 50 0 0 1 110 65"
          fill="none"
          [attr.stroke]="strokeColor"
          stroke-width="10"
          stroke-linecap="round"
          [style.stroke-dasharray]="dashArray"
          [style.stroke-dashoffset]="dashOffset"
        />
        <!-- Valor central -->
        <text x="60" y="58" text-anchor="middle" class="gauge__value">{{ displayValue }}</text>
        <text x="60" y="68" text-anchor="middle" class="gauge__unit">{{ unit }}</text>
      </svg>
      <div class="gauge__label">{{ label }}</div>
    </div>
  `,
  styles: [`
    .gauge { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .gauge__svg   { width: var(--gauge-w, 120px); height: var(--gauge-h, 75px); overflow: visible; }
    .gauge__value { font-family: var(--font-mono); font-size: var(--gauge-font-value, 18px); font-weight: 700; fill: var(--text-primary); }
    .gauge__unit  { font-size: 9px; fill: var(--text-muted); font-family: var(--font-body); }
    .gauge__label { font-size: var(--gauge-font-label, 10px); font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-secondary); }
  `]
})
export class GaugeComponent {
  @Input({ required: true }) label!: string;
  @Input() value  = 0;
  @Input() max    = 100;
  @Input() unit   = '%';
  @Input() status: SensorStatus = 'unknown';

  // Circumferencia del arco semicircular (radio 50, ángulo 180°)
  private readonly ARC_LENGTH = Math.PI * 50; // ≈ 157

  protected get displayValue(): string {
    return this.unit === '%' ? `${Math.round(this.value)}` : String(this.value);
  }

  protected get dashArray(): string {
    return `${this.ARC_LENGTH} ${this.ARC_LENGTH}`;
  }

  protected get dashOffset(): number {
    const pct    = Math.min(1, Math.max(0, this.value / this.max));
    return this.ARC_LENGTH - pct * this.ARC_LENGTH;
  }

  protected get strokeColor(): string {
    const colors: Record<SensorStatus, string> = {
      ok:      'var(--status-ok)',
      warning: 'var(--status-warning)',
      error:   'var(--status-error)',
      unusual: 'var(--status-unusual)',
      paused:  'var(--status-paused)',
      unknown: 'var(--text-muted)',
    };
    return colors[this.status];
  }
}
