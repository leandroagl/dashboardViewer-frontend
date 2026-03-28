import {
  ChangeDetectionStrategy, Component, DestroyRef, effect, inject, Input, input, signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardService } from '../../../core/services/dashboard.service';
import type { HistoryRange, HistoryPoint } from '../../../core/models';
import type { Subscription } from 'rxjs';
import type { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexTooltip, ApexStroke,
              ApexFill, ApexYAxis, ApexAnnotations, ApexMarkers, ApexDataLabels } from 'ng-apexcharts';

export type ChartOptions = {
  series:      ApexAxisChartSeries;
  chart:       ApexChart;
  xaxis:       ApexXAxis;
  yaxis:       ApexYAxis;
  stroke:      ApexStroke;
  fill:        ApexFill;
  tooltip:     ApexTooltip;
  annotations: ApexAnnotations;
  markers:     ApexMarkers;
  dataLabels:  ApexDataLabels;
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
        [markers]="opts.markers"
        [dataLabels]="opts.dataLabels"
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
export class HistoryChartComponent {
  readonly objid   = input.required<number>();
  readonly slug    = input.required<string>();
  readonly channel = input('');
  @Input() label = '';
  @Input() warningThreshold?: number;
  /** Override auto-detected unit ('MBit/s' | 'd' | '%' | 'MB' | 'ms'). */
  @Input() forceUnit?: string;
  /** When true, renders (100 - value) — use for sensors that report available/free % instead of used %. */
  @Input() invertValues = false;

  private readonly dashboard  = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);
  private loadSub?: Subscription;

  readonly ranges: HistoryRange[] = ['24h', '7d', '30d'];
  readonly range        = signal<HistoryRange>('24h');
  readonly loading      = signal(false);
  readonly error        = signal(false);
  readonly chartOptions = signal<ChartOptions | null>(null);

  constructor() {
    // effect() must be in constructor in Angular 19
    effect(() => {
      const objid = this.objid();
      const slug  = this.slug();
      const r     = this.range();
      const ch    = this.channel();
      if (objid && slug) this.loadData(objid, slug, r, ch);
    });
  }

  setRange(r: HistoryRange): void {
    this.range.set(r);
  }

  private loadData(objid: number, slug: string, range: HistoryRange, channel = ''): void {
    this.loadSub?.unsubscribe();
    this.loading.set(true);
    this.error.set(false);
    this.loadSub = this.dashboard.getHistory(slug, objid, range, channel).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        const pts: HistoryPoint[] = data.points ?? [];
        const xVals = pts.map(p => new Date(p.datetime).getTime());

        const ch     = channel.toLowerCase();
        const forced = (this.forceUnit ?? '').toLowerCase();

        const isDisk    = channel === 'diskR' || channel === 'diskW';
        const isCpuRam  = channel === 'cpu' || channel === 'ram' || forced === '%';
        const isUptime  = forced === 'd'       || ch.includes('uptime');
        const isTraffic = forced === 'mbit/s'  || ch.includes('traffic') || ch.includes('bandwidth');

        const BYTES_TO_MB    = 1_048_576;
        const SECS_TO_DAYS   = 86_400;
        // PRTG "Traffic * (speed)" channels return bytes/s → ÷ 125_000 = MBit/s
        // (1 MBit/s = 1_000_000 bits/s = 125_000 bytes/s)
        const BYTES_S_TO_MBIT = 125_000;

        const round2 = (n: number) => Math.round(n * 100) / 100;
        const rawVals = isUptime  ? pts.map(p => round2(p.value / SECS_TO_DAYS))
                      : isDisk    ? pts.map(p => round2(p.value / BYTES_TO_MB))
                      : isTraffic ? pts.map(p => round2(p.value / BYTES_S_TO_MBIT))
                      :             pts.map(p => round2(p.value));
        const yVals = this.invertValues ? rawVals.map(v => round2(100 - v)) : rawVals;

        const yUnit      = isUptime ? 'd' : isDisk ? 'MB' : isTraffic ? 'MBit/s' : isCpuRam ? '%' : 'ms';
        const yFormatter = (v: number) => v.toFixed(2) + ' ' + yUnit;

        // Líneas de referencia: máx, promedio, mín
        const yMax = yVals.length > 0 ? Math.max(...yVals) : 0;

        const statsYaxis: NonNullable<ApexAnnotations['yaxis']> = yVals.length > 0 ? [
          {
            y: yMax, borderColor: 'rgba(77,208,225,0.6)', strokeDashArray: 4,
            label: { text: `Máx ${yFormatter(yMax)}`, position: 'right',
              style: { color: '#4dd0e1', background: 'transparent', fontSize: '10px', padding: { right: 4 } } }
          },
        ] : [];

        const annotations: ApexAnnotations = { yaxis: statsYaxis };
        if (this.warningThreshold != null) {
          annotations.yaxis!.push({
            y:            this.warningThreshold,
            borderColor:  'var(--status-warning)',
            strokeDashArray: 4,
            label: {
              text:  `${this.warningThreshold} ms`,
              style: { color: 'var(--status-warning)', background: 'transparent', fontSize: '10px' }
            }
          });
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
            title: {
              text: yUnit,
              style: { fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400 },
            },
            labels: {
              style: { fontSize: '10px', colors: 'var(--text-muted)' },
              formatter: yFormatter,
            },
            ...(isCpuRam ? { min: 0, max: 100 } : {}),
          },
          dataLabels: { enabled: false },
          markers: {
            size: 0,
            hover: { size: 4, sizeOffset: 0 },
          },
          stroke: { curve: 'smooth', width: 2 },
          fill: {
            type: 'gradient',
            gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] }
          },
          tooltip: {
            theme: 'dark',
            x: { format: dateFormat === 'HH:mm' ? 'HH:mm' : 'dd MMM' },
            y: { formatter: yFormatter },
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
