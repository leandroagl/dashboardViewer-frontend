// ─── ConfirmDialogComponent ───────────────────────────────────────────────────
// Diálogo de confirmación reutilizable con estilo Material.
// Uso: this.dialog.open(ConfirmDialogComponent, { data: { title, message } })
//      .afterClosed().subscribe(confirmed => { if (confirmed) ... });

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title:          string;
  message:        string;
  confirmLabel?:  string;
  isDanger?:      boolean;
}

@Component({
  selector:        'app-confirm-dialog',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-header">
      <mat-icon class="confirm-header__icon" [class.confirm-header__icon--danger]="data.isDanger">
        {{ data.isDanger ? 'warning' : 'help_outline' }}
      </mat-icon>
      <h2 mat-dialog-title>{{ data.title }}</h2>
    </div>

    <mat-dialog-content>
      <p class="confirm-message">{{ data.message }}</p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancelar</button>
      <button
        mat-flat-button
        [color]="data.isDanger ? 'warn' : 'primary'"
        (click)="confirm()"
      >
        {{ data.confirmLabel ?? 'Confirmar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .confirm-header {
      display: flex; align-items: center; gap: 10px; padding: 20px 24px 0;
    }
    .confirm-header__icon {
      font-size: 24px; width: 24px; height: 24px;
      color: var(--color-primary); flex-shrink: 0;
    }
    .confirm-header__icon--danger { color: var(--status-error); }
    h2[mat-dialog-title] { margin: 0; padding: 0; font-size: 16px; font-weight: 500; }
    .confirm-message { color: var(--text-secondary); font-size: 14px; margin: 0; }
  `],
})
export class ConfirmDialogComponent {
  protected readonly data     = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private  readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  protected confirm(): void { this.dialogRef.close(true); }
  protected cancel():  void { this.dialogRef.close(false); }
}
