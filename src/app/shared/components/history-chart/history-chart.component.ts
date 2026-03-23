// ─── HistoryChartComponent ────────────────────────────────────────────────────
// Gráfico completo de serie temporal con selector de rango (1h/24h/7d/30d).
// Usa ng-apexcharts. Carga datos al inicializar y al cambiar el rango.

import {
  ChangeDetectionStrategy, Component, Input, OnInit, inject, signal, effect,
} from '@angular/core';
import { DashboardService } from '@core/services/dashboard.service';
import { HistoryRange, HistoryData } from '@core/models';

@Component({
  selector:   'app-history-chart',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hchart">
      <!-- Range selector -->
      <div class="hchart__ranges">
        <button
          *ngFor="let r of ranges"
          class="hchart__range-btn"
          [class.hchart__range-btn--active]="selectedRange() === r"
          (click)="selectRange(r)"
        >{{ r }}</button>
      </div>

      <!-- Loading -->
      <div class="hchart__loading" *ngIf="loading()">
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      </div>

      <!-- Chart -->
      <apx-chart
        *ngIf="!loading() && chartSeries().length > 0"
        [series]="chartSeries()"
        [chart]="chartConfig"
        [xaxis]="xaxis()"
        [yaxis]="yaxis"
        [tooltip]="tooltip"
        [stroke]="stroke"
        [fill]="fill"
        [grid]="grid"
        [theme]="theme"
        [annotations]="annotations()"
      ></apx-chart>

      <!-- Stats row -->
      <div class="hchart__stats" *ngIf="historyData() as d">
        <div class="hchart__stat">
          <span class="hchart__stat-lbl">Máx</span>
          <span class="hchart__stat-val mono">{{ d.stats.max | number:'1.1-1' }}</span>
        </div>
        <div class="hchart__stat">
          <span class="hchart__stat-lbl">Prom</span>
          <span class="hchart__stat-val mono">{{ d.stats.avg | number:'1.1-1' }}</span>
        </div>
        <div class="hchart__stat">
          <span class="hchart__stat-lbl">Mín</span>
          <span class="hchart__stat-val mono">{{ d.stats.min | number:'1.1-1' }}</span>
        </div>
      </div>

      <div class="hchart__empty" *ngIf="!loading() && chartSeries().length === 0">
        Sin datos para el rango seleccionado.
      </div>
    </div>
  `,
  styles: [`
    .hchart { display: flex; flex-direction: column; gap: 10px; }
    .hchart__ranges { display: flex; gap: 4px; }
    .hchart__range-btn { padding: 3px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); background: transparent; color: var(--text-muted); font-size: 11px; cursor: pointer; transition: all var(--transition); }
    .hchart__range-btn--active { background: var(--primary); color: #fff; border-color: var(--primary); }
    .hchart__loading { height: 4px; }
    .hchart__stats { display: flex; gap: 24px; padding-top: 4px; }
    .hchart__stat  { display: flex; flex-direction: column; }
    .hchart__stat-lbl { font-size: 10px; color: var(--text-muted); text-transform: uppercase; }
    .hchart__stat-val { font-size: 14px; color: var(--text-primary); }
    .hchart__empty { font-size: 12px; color: var(--text-muted); text-align: center; padding: 20px 0; }
  `],
})
export class HistoryChartComponent implements OnInit {
  @Input({ required: true }) objid!: number;
  @Input({ required: true }) slug!:  string;
  @Input() label?: string;
  /** Threshold line shown as dashed orange annotation (e.g., 80 ms for Sucursales latency). */
  @Input() warningThreshold?: number;

  private readonly svc = inject(DashboardService);

  readonly ranges: HistoryRange[] = ['1h', '24h', '7d', '30d'];
  readonly selectedRange = signal<HistoryRange>('24h');
  readonly loading       = signal(false);
  readonly historyData   = signal<HistoryData | null>(null);

  // ApexCharts config (static parts)
  readonly chartConfig = {
    type:    'area' as const,
    height:  180,
    toolbar: { show: false },
    zoom:    { enabled: false },
    background: 'transparent',
    fontFamily: 'DM Sans, sans-serif',
  };
  readonly yaxis   = { labels: { style: { colors: ['var(--text-muted)'] } } };
  readonly tooltip = { theme: 'dark' as const, x: { format: 'dd/MM HH:mm' } };
  readonly stroke  = { curve: 'smooth' as const, width: 2 };
  readonly fill    = { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0 } };
  readonly grid    = { borderColor: 'var(--border-subtle)', strokeDashArray: 3 };
  readonly theme   = { mode: 'dark' as const };

  readonly chartSeries  = signal<{ name: string; data: [number, number][] }[]>([]);
  readonly annotations  = signal<object>({});

  xaxis = signal<object>({ type: 'datetime', labels: { style: { colors: 'var(--text-muted)' } } });

  constructor() {
    // effect() must be in constructor (not ngOnInit) in Angular 19
    effect(() => {
      this.selectedRange(); // track signal — re-runs loadData on range change
      this.loadData();
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    // Initial load is handled by the constructor effect above
  }

  selectRange(range: HistoryRange): void {
    this.selectedRange.set(range);
  }

  private getDateFormat(range: HistoryRange): string {
    switch (range) {
      case '1h':  return 'HH:mm';
      case '24h': return 'dd/MM HH:mm';
      default:    return 'dd/MM';
    }
  }

  private loadData(): void {
    this.loading.set(true);
    this.svc.getHistory(this.slug, this.objid, this.selectedRange()).subscribe({
      next: data => {
        this.historyData.set(data);
        this.chartSeries.set([{
          name: data.sensorName,
          data: data.points.map(p => [new Date(p.timestamp).getTime(), p.value]),
        }]);
        this.xaxis.set({
          type: 'datetime',
          labels: {
            style:  { colors: 'var(--text-muted)' },
            format: this.getDateFormat(this.selectedRange()),
          },
        });
        // Warning threshold annotation (used by Sucursales for the 80ms latency line)
        if (this.warningThreshold != null) {
          this.annotations.set({
            yaxis: [{
              y:           this.warningThreshold,
              borderColor: 'var(--status-warning)',
              borderWidth: 1,
              strokeDashArray: 4,
              label: {
                text:  `${this.warningThreshold} ms`,
                style: { color: 'var(--status-warning)', background: 'transparent' },
              },
            }],
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.chartSeries.set([]);
      },
    });
  }
}
