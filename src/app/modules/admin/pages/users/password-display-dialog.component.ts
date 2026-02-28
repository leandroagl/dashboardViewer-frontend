import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatDialogModule, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";

interface DialogData {
  password: string;
  title?: string;
}

@Component({
  selector: "app-password-display-dialog",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  template: `
    <div class="pwd-dialog">
      <div class="pwd-dialog__icon">
        <mat-icon>key</mat-icon>
      </div>

      <h2 class="pwd-dialog__title">
        {{ data.title ?? "Contraseña generada" }}
      </h2>

      <p class="pwd-dialog__warn">
        <mat-icon>warning_amber</mat-icon>
        Guardala ahora — no se volverá a mostrar
      </p>

      <div class="pwd-dialog__box">
        <span class="pwd-dialog__value">{{ data.password }}</span>
        <button
          mat-icon-button
          class="pwd-dialog__copy"
          (click)="copy()"
          [matTooltip]="copied() ? '¡Copiada!' : 'Copiar'"
        >
          <mat-icon>{{ copied() ? "check" : "content_copy" }}</mat-icon>
        </button>
      </div>

      <mat-dialog-actions align="end">
        <button
          mat-flat-button
          mat-dialog-close
          color="primary"
          class="pwd-dialog__close"
        >
          Entendido
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .pwd-dialog {
        padding: 8px 8px 4px;
        text-align: center;
        min-width: 380px;
      }

      .pwd-dialog__icon {
        width: 56px;
        height: 56px;
        background: rgba(77, 208, 225, 0.1);
        border: 1px solid rgba(77, 208, 225, 0.25);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
        mat-icon {
          color: #4dd0e1;
          font-size: 26px;
          width: 26px;
          height: 26px;
        }
      }

      .pwd-dialog__title {
        font-size: 18px;
        font-weight: 500;
        margin: 0 0 8px;
        color: rgba(255, 255, 255, 0.9);
      }

      .pwd-dialog__warn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-size: 12px;
        color: rgba(255, 193, 7, 0.85);
        margin: 0 0 20px;
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          color: rgba(255, 193, 7, 0.85);
        }
      }

      .pwd-dialog__box {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(77, 208, 225, 0.06);
        border: 1px solid rgba(77, 208, 225, 0.2);
        border-radius: 8px;
        padding: 12px 8px 12px 16px;
        margin-bottom: 24px;
      }

      .pwd-dialog__value {
        flex: 1;
        font-family: var(--font-mono);
        font-size: 18px;
        font-weight: 600;
        letter-spacing: 0.08em;
        color: #4dd0e1;
        text-align: left;
        word-break: break-all;
      }

      .pwd-dialog__copy {
        color: rgba(255, 255, 255, 0.5) !important;
        flex-shrink: 0;
        transition: color 200ms ease !important;
        &:hover {
          color: rgba(255, 255, 255, 0.9) !important;
        }
      }

      .pwd-dialog__close {
        background: #4dd0e1 !important;
        color: #0a0d12 !important;
        font-weight: 600 !important;
        min-width: 120px;
      }
    `,
  ],
})
export class PasswordDisplayDialogComponent {
  protected readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  protected readonly copied = signal(false);

  protected copy(): void {
    navigator.clipboard.writeText(this.data.password).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
