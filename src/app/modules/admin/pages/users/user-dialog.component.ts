import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { UsersService } from '@core/services/users.service';
import { ClientsService } from '@core/services/clients.service';
import { Client, UserRole } from '@core/models';

@Component({
  selector:   'app-user-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>Nuevo usuario</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nombre completo</mat-label>
          <input matInput formControlName="nombre" />
          <mat-error>Requerido</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" />
          <mat-error *ngIf="form.get('email')?.hasError('required')">Requerido</mat-error>
          <mat-error *ngIf="form.get('email')?.hasError('email')">Email inválido</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Rol</mat-label>
          <mat-select formControlName="rol">
            <mat-option value="admin_ondra">Admin ONDRA</mat-option>
            <mat-option value="viewer">Viewer</mat-option>
            <mat-option value="viewer_kiosk">Viewer Kiosk</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full" *ngIf="showClientField()">
          <mat-label>Cliente</mat-label>
          <mat-select formControlName="cliente_id">
            <mat-option *ngFor="let c of clients()" [value]="c.id">{{ c.nombre }}</mat-option>
          </mat-select>
          <mat-error>Requerido para este rol</mat-error>
        </mat-form-field>

        <div class="dialog-kiosk-toggle" *ngIf="form.get('rol')?.value === 'viewer_kiosk'">
          <mat-slide-toggle formControlName="es_kiosk" color="primary">
            Sesión kiosk (sin expiración)
          </mat-slide-toggle>
        </div>

        <div class="dialog-info" *ngIf="!error()">
          <mat-icon>info_outline</mat-icon>
          La contraseña se genera automáticamente y se muestra una sola vez al crear.
        </div>

        <div class="dialog-error" *ngIf="error()">
          <mat-icon>error_outline</mat-icon> {{ error() }}
        </div>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="submit()" [disabled]="form.invalid || loading()">
        {{ loading() ? 'Creando...' : 'Crear usuario' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 4px; padding-top: 8px; min-width: 420px; }
    .dialog-kiosk-toggle { padding: 4px 0 8px; }
    .dialog-info, .dialog-error {
      display: flex; align-items: center; gap: 6px; padding: 10px 12px; margin-top: 4px;
      border-radius: 6px; font-size: 12px;
    }
    .dialog-info  { background: rgba(77,208,225,0.08); color: rgba(255,255,255,0.6); border: 1px solid rgba(77,208,225,0.2); }
    .dialog-error { background: rgba(244,67,54,0.08); color: #f44336; border: 1px solid rgba(244,67,54,0.2); }
    mat-icon { font-size: 16px; width: 16px; height: 16px; }
  `]
})
export class UserDialogComponent implements OnInit {
  private readonly fb             = inject(FormBuilder);
  private readonly usersService   = inject(UsersService);
  private readonly clientsService = inject(ClientsService);
  private readonly dialogRef      = inject(MatDialogRef<UserDialogComponent>);

  protected readonly loading         = signal(false);
  protected readonly error           = signal('');
  protected readonly clients         = signal<Client[]>([]);
  protected readonly showClientField = signal(true);

  protected readonly form = this.fb.group({
    nombre:     ['', Validators.required],
    email:      ['', [Validators.required, Validators.email]],
    rol:        ['viewer', Validators.required],
    cliente_id: [''],
    es_kiosk:   [false],
  });

  ngOnInit(): void {
    this.clientsService.getAll().subscribe(c => this.clients.set(c));

    this.form.get('rol')!.valueChanges.subscribe(rol => {
      const isAdmin = rol === 'admin_ondra';
      this.showClientField.set(!isAdmin);
      const ctrl = this.form.get('cliente_id')!;
      if (isAdmin) { ctrl.clearValidators(); ctrl.setValue(''); }
      else         { ctrl.setValidators(Validators.required); }
      ctrl.updateValueAndValidity();
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.error.set('');
    this.loading.set(true);
    const val = this.form.getRawValue();
    this.usersService.create({
      nombre:     val.nombre!,
      email:      val.email!,
      rol:        val.rol as UserRole,
      cliente_id: val.cliente_id || undefined,
      es_kiosk:   val.es_kiosk ?? false,
    }).subscribe({
      next:  r   => this.dialogRef.close(r),
      error: err => { this.loading.set(false); this.error.set(err?.error?.error ?? 'Error al crear el usuario.'); },
    });
  }
}
