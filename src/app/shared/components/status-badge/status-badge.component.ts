// ─── StatusBadgeComponent ─────────────────────────────────────────────────────
// Chip de color semántico para representar el estado de un sensor.

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SensorStatus } from '@core/models';

const STATUS_LABELS: Record<SensorStatus, string> = {
  ok:      'OK',
  warning: 'Warning',
  error:   'Error',
  unusual: 'Inusual',
  paused:  'Pausado',
  unknown: 'Desconocido',
};

@Component({
  selector:    'app-status-badge',
  standalone:  false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="status-chip status-chip--{{ status }}">
      <span class="dot"></span>
      {{ label || STATUS_LABELS[status] }}
    </span>
  `,
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: SensorStatus;
  @Input() label?: string;

  protected readonly STATUS_LABELS = STATUS_LABELS;
}
