// ─── HealthBarComponent ────────────────────────────────────────────────────────
// Horizontal segmented bar showing ok / warning / error host counts.

import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';

@Component({
  selector:   'app-health-bar',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="health-bar">
      <div class="health-bar__track">
        <div class="health-bar__seg health-bar__seg--ok"      [style.flex]="okCount"      *ngIf="okCount > 0"     [matTooltip]="okCount + ' OK'"></div>
        <div class="health-bar__seg health-bar__seg--warning" [style.flex]="warnCount"    *ngIf="warnCount > 0"   [matTooltip]="warnCount + ' Warning'"></div>
        <div class="health-bar__seg health-bar__seg--error"   [style.flex]="errorCount"   *ngIf="errorCount > 0"  [matTooltip]="errorCount + ' Error/Down'"></div>
        <div class="health-bar__seg health-bar__seg--empty"   [style.flex]="1"            *ngIf="total === 0"></div>
      </div>
      <div class="health-bar__legend">
        <span class="health-bar__litem health-bar__litem--ok"      *ngIf="okCount > 0">{{ okCount }} OK</span>
        <span class="health-bar__litem health-bar__litem--warning"  *ngIf="warnCount > 0">{{ warnCount }} Warn</span>
        <span class="health-bar__litem health-bar__litem--error"    *ngIf="errorCount > 0">{{ errorCount }} Error</span>
      </div>
    </div>
  `,
  styles: [`
    .health-bar { display: flex; flex-direction: column; gap: 4px; }
    .health-bar__track {
      display: flex;
      height: 6px;
      border-radius: 4px;
      overflow: hidden;
      background: var(--bg-elevated);
      gap: 1px;
    }
    .health-bar__seg { min-width: 4px; border-radius: 2px; transition: flex 0.4s; }
    .health-bar__seg--ok      { background: var(--status-ok); }
    .health-bar__seg--warning { background: var(--status-warning); }
    .health-bar__seg--error   { background: var(--status-error); }
    .health-bar__seg--empty   { background: var(--border-subtle); }
    .health-bar__legend { display: flex; gap: 12px; }
    .health-bar__litem {
      font-size: 10px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .health-bar__litem--ok      { color: var(--status-ok); }
    .health-bar__litem--warning { color: var(--status-warning); }
    .health-bar__litem--error   { color: var(--status-error); }
  `]
})
export class HealthBarComponent implements OnChanges {
  @Input() okCount    = 0;
  @Input() warnCount  = 0;
  @Input() errorCount = 0;

  total = 0;

  ngOnChanges(): void {
    this.total = this.okCount + this.warnCount + this.errorCount;
  }
}
