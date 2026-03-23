import {
  ChangeDetectionStrategy, Component, effect, inject, Input, OnChanges, signal
} from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import type { HistoryRange, HistoryPoint } from '../../../core/models';
import type { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexTooltip, ApexStroke,
              ApexFill, ApexYAxis, ApexAnnotations } from 'ng-apexcharts';

export type ChartOptions = {
  series:      ApexAxisChartSeries;
  chart:       ApexChart;
  xaxis:       ApexXAxis;
  yaxis:       ApexYAxis;
  stroke:      ApexStroke;
  fill:        ApexFill;
  tooltip:     ApexTooltip;
  annotations: ApexAnnotations;
  colors:      string[];
  grid:        object;
  theme:       object;
};

@Component({
  selector:   'app-history-chart',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hchart">
      <!-- Range selector -->
      <div class="hchart__ranges">
        <button *ngFor="let r of ranges"
          class="hchart__range-btn"
          [class.active]="range() === r"
          (click)="setRange(r)">
          {{ r }}
        </button>
      </div>

      <!-- Loading -->
      <div class="hchart__loading" *ngIf="loading()">
        <div class="skeleton" style="height:160px; border-radius:var(--radius-sm)"></div>
      </div>

      <!-- Error -->
      <div class="hchart__error" *ngIf="error() && !loading()">
        <span>No se pudieron cargar los datos.</span>
      </div>

      <!-- Chart -->
      <apx-chart *ngIf="!loading() && !error() && chartOptions() as opts"
        [series]="opts.series"
        [chart]="opts.chart"
        [xaxis]="opts.xaxis"
        [yaxis]="opts.yaxis"
        [stroke]="opts.stroke"
        [fill]="opts.fill"
        [tooltip]="opts.tooltip"
        [annotations]="opts.annotations"
        [colors]="opts.colors"
        [grid]="opts.grid"
        [theme]="opts.theme"
      ></apx-chart>
    </div>
  `,
  styles: [`
    .hchart { display: flex; flex-direction: column; gap: 8px; }
    .hchart__ranges {
      display: flex; gap: 4px;
    }
    .hchart__range-btn {
      font-size: 11px; padding: 2px 8px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
    }
    .hchart__range-btn.active {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
    .hchart__loading, .hchart__error {
      padding: 12px;
      font-size: 12px;
      color: var(--text-muted);
    }
  `]
})
export class HistoryChartComponent implements OnChanges {
  @Input({ required: true }) objid!: number;
  @Input({ required: true }) slug!:  string;
  @Input() label = '';
  @Input() warningThreshold?: number;

  private readonly dashboard = inject(DashboardService);

  readonly ranges: HistoryRange[] = ['1h', '24h', '7d', '30d'];
  readonly range        = signal<HistoryRange>('24h');
  readonly loading      = signal(false);
  readonly error        = signal(false);
  readonly chartOptions = signal<ChartOptions | null>(null);

  constructor() {
    // effect() must be in constructor in Angular 19
    effect(() => {
      const r = this.range(); // track signal
      if (this.objid && this.slug) this.loadData(this.objid, this.slug, r);
    });
  }

  ngOnChanges(): void {
    if (this.objid && this.slug) this.loadData(this.objid, this.slug, this.range());
  }

  setRange(r: HistoryRange): void {
    this.range.set(r);
  }

  private loadData(objid: number, slug: string, range: HistoryRange): void {
    this.loading.set(true);
    this.error.set(false);
    this.dashboard.getHistory(slug, objid, range).subscribe({
      next: (data) => {
        const pts: HistoryPoint[] = data.points ?? [];
        const xVals = pts.map(p => new Date(p.datetime).getTime());
        const yVals = pts.map(p => p.value);

        const annotations: ApexAnnotations = {};
        if (this.warningThreshold != null) {
          annotations.yaxis = [{
            y:            this.warningThreshold,
            borderColor:  'var(--status-warning)',
            strokeDashArray: 4,
            label: {
              text:  `${this.warningThreshold} ms`,
              style: { color: 'var(--status-warning)', background: 'transparent', fontSize: '10px' }
            }
          }];
        }

        const dateFormat = range === '1h' || range === '24h' ? 'HH:mm' : 'dd/MM';

        this.chartOptions.set({
          series: [{ name: this.label || 'Valor', data: yVals }],
          chart: {
            type: 'area',
            height: 160,
            toolbar: { show: false },
            sparkline: { enabled: false },
            background: 'transparent',
            animations: { enabled: false },
          },
          xaxis: {
            type: 'datetime',
            categories: xVals,
            labels: {
              datetimeFormatter: { hour: 'HH:mm', day: 'dd MMM' },
              style: { fontSize: '10px', colors: 'var(--text-muted)' },
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
          },
          yaxis: {
            labels: {
              style: { fontSize: '10px', colors: 'var(--text-muted)' },
              formatter: (v: number) => v.toFixed(1),
            },
          },
          stroke: { curve: 'smooth', width: 2 },
          fill: {
            type: 'gradient',
            gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] }
          },
          tooltip: {
            theme: 'dark',
            x: { format: dateFormat === 'HH:mm' ? 'HH:mm' : 'dd MMM' },
          },
          annotations,
          colors:  ['#4dd0e1'],
          grid: {
            borderColor: 'rgba(255,255,255,0.06)',
            strokeDashArray: 3,
          },
          theme: { mode: 'dark' },
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }
}
