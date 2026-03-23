// ─── HealthBarComponent ───────────────────────────────────────────────────────
// Barra de salud global segmentada: verde/naranja/rojo proporcional.

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector:   'app-health-bar',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="health-bar">
      <span class="health-bar__label">Salud global</span>
      <div class="health-bar__track">
        <div class="health-bar__seg health-bar__seg--ok"      [style.width.%]="okPct"></div>
        <div class="health-bar__seg health-bar__seg--warning" [style.width.%]="warnPct"></div>
        <div class="health-bar__seg health-bar__seg--error"   [style.width.%]="errorPct"></div>
        <div class="health-bar__seg health-bar__seg--empty"   *ngIf="total === 0" style="width:100%"></div>
      </div>
      <div class="health-bar__legend" *ngIf="total > 0">
        <span class="ok">{{ okCount }} OK</span>
        <span class="warn" *ngIf="warnCount > 0">{{ warnCount }} warning</span>
        <span class="err"  *ngIf="errorCount > 0">{{ errorCount }} error</span>
      </div>
    </div>
  `,
  styles: [`
    .health-bar { display: flex; align-items: center; gap: 10px; }
    .health-bar__label { font-size: 11px; color: var(--text-muted); white-space: nowrap; flex-shrink: 0; }
    .health-bar__track { flex: 1; height: 6px; border-radius: 3px; background: var(--bg-elevated); overflow: hidden; display: flex; }
    .health-bar__seg   { height: 100%; transition: width 0.4s; }
    .health-bar__seg--ok      { background: var(--status-ok);      }
    .health-bar__seg--warning { background: var(--status-warning);  }
    .health-bar__seg--error   { background: var(--status-error);    }
    .health-bar__seg--empty   { background: var(--border-subtle);   }
    .health-bar__legend { display: flex; gap: 8px; font-size: 11px; flex-shrink: 0; }
    .health-bar__legend .ok   { color: var(--status-ok);      }
    .health-bar__legend .warn { color: var(--status-warning);  }
    .health-bar__legend .err  { color: var(--status-error);    }
  `],
})
export class HealthBarComponent {
  @Input({ required: true }) okCount!:    number;
  @Input({ required: true }) warnCount!:  number;
  @Input({ required: true }) errorCount!: number;

  get total(): number   { return this.okCount + this.warnCount + this.errorCount; }
  get okPct(): number   { return this.total ? (this.okCount    / this.total) * 100 : 0; }
  get warnPct(): number { return this.total ? (this.warnCount  / this.total) * 100 : 0; }
  get errorPct(): number{ return this.total ? (this.errorCount / this.total) * 100 : 0; }
}
