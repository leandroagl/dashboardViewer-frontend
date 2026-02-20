// ─── SharedModule ─────────────────────────────────────────────────────────────
// Componentes, pipes y directivas reutilizables en toda la app.

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { StatusBadgeComponent } from './components/status-badge/status-badge.component';
import { KpiCardComponent }     from './components/kpi-card/kpi-card.component';
import { GaugeComponent }       from './components/gauge/gauge.component';
import { AlertListComponent }   from './components/alert-list/alert-list.component';
import { PageHeaderComponent }  from './components/page-header/page-header.component';
import { StripHtmlPipe } from './pipes/strip-html.pipe';

const COMPONENTS = [
  StatusBadgeComponent,
  KpiCardComponent,
  GaugeComponent,
  AlertListComponent,
  PageHeaderComponent,
  StripHtmlPipe
];

const MATERIAL = [
  MatIconModule,
  MatButtonModule,
  MatTooltipModule,
  MatProgressBarModule,
];

@NgModule({
  declarations: [...COMPONENTS],
  imports:      [CommonModule, RouterModule, ...MATERIAL],
  exports:      [...COMPONENTS, CommonModule, RouterModule, ...MATERIAL],
})
export class SharedModule {}
