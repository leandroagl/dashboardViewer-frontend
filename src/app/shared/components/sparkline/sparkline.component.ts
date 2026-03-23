// ─── SparklineComponent ────────────────────────────────────────────────────────
// Mini sparkline SVG that renders a series of values as a polyline.

import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';

@Component({
  selector:   'app-sparkline',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg class="sparkline" [attr.viewBox]="'0 0 ' + W + ' ' + H" [attr.width]="W" [attr.height]="H" preserveAspectRatio="none">
      <polyline
        *ngIf="points"
        [attr.points]="points"
        fill="none"
        [attr.stroke]="color"
        stroke-width="1.5"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
      <text *ngIf="!points" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
        font-size="8" fill="var(--border-subtle)">—</text>
    </svg>
  `,
  styles: [`
    .sparkline { display: block; overflow: visible; }
  `]
})
export class SparklineComponent implements OnChanges {
  @Input() values: number[] = [];
  @Input() color  = 'var(--status-ok)';

  readonly W = 68;
  readonly H = 24;

  points: string | null = null;

  ngOnChanges(): void {
    this.points = this.buildPoints();
  }

  private buildPoints(): string | null {
    const v = this.values;
    if (!v || v.length < 2) return null;

    const min = Math.min(...v);
    const max = Math.max(...v);
    const range = max - min || 1;
    const pad = 2;

    const pts = v.map((val, i) => {
      const x = pad + (i / (v.length - 1)) * (this.W - pad * 2);
      const y = (this.H - pad) - ((val - min) / range) * (this.H - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return pts.join(' ');
  }
}
