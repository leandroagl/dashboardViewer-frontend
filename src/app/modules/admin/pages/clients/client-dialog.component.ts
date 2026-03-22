import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { ClientsService } from "@core/services/clients.service";
import { Client } from "@core/models";

@Component({
  selector: "app-client-dialog",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ editMode ? 'Editar cliente' : 'Nuevo cliente' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nombre del cliente</mat-label>
          <input
            matInput
            formControlName="nombre"
            placeholder="Ej: Empresa ABC"
          />
          <mat-error *ngIf="form.get('nombre')?.hasError('required')"
            >Requerido</mat-error
          >
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Slug (URL)</mat-label>
          <input matInput formControlName="slug" placeholder="empresa-abc" />
          <mat-hint *ngIf="!editMode"
            >Solo minúsculas, números y guiones. No se puede cambiar
            después.</mat-hint
          >
          <mat-hint *ngIf="editMode">El slug no se puede modificar.</mat-hint>
          <mat-error *ngIf="form.get('slug')?.hasError('required')"
            >Requerido</mat-error
          >
          <mat-error *ngIf="form.get('slug')?.hasError('pattern')"
            >Solo minúsculas, números y guiones</mat-error
          >
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Grupo PRTG</mat-label>
          <input
            matInput
            formControlName="prtg_group"
            placeholder="Nombre exacto del grupo en PRTG"
          />
          <mat-hint
            >Debe coincidir exactamente con el nombre del grupo raíz en
            PRTG.</mat-hint
          >
          <mat-error *ngIf="form.get('prtg_group')?.hasError('required')"
            >Requerido</mat-error
          >
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Sondas extra PRTG (opcional)</mat-label>
          <input
            matInput
            formControlName="prtg_extra_probes"
            placeholder="Sonda1,Sonda2"
          />
          <mat-hint>Nombres de sondas adicionales, separados por comas.</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>URL del logo (opcional)</mat-label>
          <input
            matInput
            formControlName="logo_url"
            placeholder="https://..."
          />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Color de marca (opcional)</mat-label>
          <input
            matInput
            formControlName="color_marca"
            placeholder="#4dd0e1"
          />
          <mat-hint>Color hexadecimal, ej: #4dd0e1</mat-hint>
        </mat-form-field>

        <div class="dialog-error" *ngIf="error()">
          <mat-icon>error_outline</mat-icon> {{ error() }}
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        (click)="submit()"
        [disabled]="form.invalid || loading()"
      >
        {{ loading() ? 'Guardando...' : (editMode ? 'Guardar cambios' : 'Crear cliente') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-form {
        display: flex;
        flex-direction: column;
        gap: 24px;
        padding-top: 8px;
        min-width: 420px;
      }
      .dialog-error {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 10px 12px;
        margin-top: 4px;
        background: rgba(244, 67, 54, 0.08);
        border: 1px solid rgba(244, 67, 54, 0.2);
        border-radius: 6px;
        color: #f44336;
        font-size: 13px;
      }
      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    `,
  ],
})
export class ClientDialogComponent {
  private readonly fb        = inject(FormBuilder);
  private readonly service   = inject(ClientsService);
  private readonly dialogRef = inject(MatDialogRef<ClientDialogComponent>);
  private readonly data      = inject<{ client?: Client }>(MAT_DIALOG_DATA, { optional: true });

  protected readonly editMode = !!this.data?.client;
  protected readonly loading  = signal(false);
  protected readonly error    = signal("");

  protected readonly form = this.fb.group({
    nombre:            [this.data?.client?.nombre            ?? "", Validators.required],
    slug:              [this.data?.client?.slug              ?? "", [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    prtg_group:        [this.data?.client?.prtg_group        ?? "", Validators.required],
    prtg_extra_probes: [this.data?.client?.prtg_extra_probes ?? ""],
    logo_url:          [this.data?.client?.logo_url          ?? ""],
    color_marca:       [this.data?.client?.color_marca       ?? ""],
  });

  constructor() {
    if (this.editMode) {
      this.form.get('slug')!.disable();
    }
  }

  protected submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.error.set("");
    this.loading.set(true);

    if (this.editMode) {
      const v = this.form.getRawValue();
      this.service
        .update(this.data!.client!.id, {
          nombre:            v.nombre!,
          prtg_group:        v.prtg_group!,
          prtg_extra_probes: v.prtg_extra_probes || null,
          logo_url:          v.logo_url          || null,
          color_marca:       v.color_marca        || null,
        })
        .subscribe({
          next:  (c) => this.dialogRef.close(c),
          error: (err) => {
            this.loading.set(false);
            this.error.set(err?.error?.error ?? "Error al guardar los cambios.");
          },
        });
    } else {
      const v = this.form.getRawValue();
      this.service
        .create({
          nombre:            v.nombre!,
          slug:              v.slug!,
          prtg_group:        v.prtg_group!,
          prtg_extra_probes: v.prtg_extra_probes || null,
          logo_url:          v.logo_url          || null,
          color_marca:       v.color_marca        || null,
        })
        .subscribe({
          next:  (c) => this.dialogRef.close(c),
          error: (err) => {
            this.loading.set(false);
            this.error.set(err?.error?.error ?? "Error al crear el cliente.");
          },
        });
    }
  }
}
