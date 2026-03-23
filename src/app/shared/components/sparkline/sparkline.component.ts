// ─── SparklineComponent ────────────────────────────────────────────────────────
// Mini gráfico de tendencia SVG inline. No hace llamadas API — solo renderiza
// el array de values recibido como @Input.

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector:   'app-sparkline',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="width"
      [attr.height]="height"
      [attr.viewBox]="'0 0 ' + width + ' ' + height"
      style="display:block;overflow:visible"
    >
      <ng-container *ngIf="polylinePoints">
        <!-- Área de gradiente bajo la línea -->
        <defs>
          <linearGradient [attr.id]="gradientId" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   [attr.stop-color]="color" stop-opacity="0.3" />
            <stop offset="100%" [attr.stop-color]="color" stop-opacity="0"   />
          </linearGradient>
        </defs>
        <polygon [attr.points]="areaPoints" [attr.fill]="'url(#' + gradientId + ')'" />
        <!-- Línea -->
        <polyline
          [attr.points]="polylinePoints"
          fill="none"
          [attr.stroke]="color"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <!-- Punto final resaltado -->
        <circle
          [attr.cx]="lastX"
          [attr.cy]="lastY"
          r="2"
          [attr.fill]="color"
        />
      </ng-container>
      <!-- Línea plana cuando no hay datos -->
      <ng-container *ngIf="!polylinePoints">
        <line
          x1="0" [attr.y1]="height / 2"
          [attr.x2]="width" [attr.y2]="height / 2"
          [attr.stroke]="color" stroke-width="1" stroke-opacity="0.3"
        />
      </ng-container>
    </svg>
  `,
  styles: [':host { display: inline-block; }'],
})
export class SparklineComponent {
  @Input() values: number[] = [];
  @Input() color:  string   = 'var(--status-ok)';
  @Input() width:  number   = 64;
  @Input() height: number   = 18;

  // Unique ID for SVG gradient to avoid conflicts when multiple sparklines exist
  readonly gradientId = `spark-grad-${Math.random().toString(36).slice(2)}`;

  private get coords(): { x: number; y: number }[] | null {
    if (this.values.length < 2) return null;
    const min   = Math.min(...this.values);
    const max   = Math.max(...this.values);
    const range = max - min || 1;
    const xStep = this.width / (this.values.length - 1);
    const pad   = 2; // vertical padding so the stroke doesn't clip

    return this.values.map((v, i) => ({
      x: i * xStep,
      y: this.height - pad - ((v - min) / range) * (this.height - pad * 2),
    }));
  }

  get polylinePoints(): string | null {
    const pts = this.coords;
    if (!pts) return null;
    return pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  }

  get areaPoints(): string {
    const pts = this.coords;
    if (!pts) return '';
    const line  = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const close = `${pts[pts.length - 1].x.toFixed(1)},${this.height} 0,${this.height}`;
    return `${line} ${close}`;
  }

  get lastX(): number { return this.coords?.at(-1)?.x ?? 0; }
  get lastY(): number { return this.coords?.at(-1)?.y ?? this.height / 2; }
}
