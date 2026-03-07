# Fix Edición de Clientes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Corregir el dialog de edición de clientes para que cargue los datos del cliente y proteger al cliente ONDRA de ser modificado.

**Architecture:** Un solo componente `ClientDialogComponent` pasa a ser dual-mode (crear / editar) leyendo `MAT_DIALOG_DATA`. La protección del cliente ONDRA se implementa en el template de `clients-page` con `*ngIf` sobre `c.slug === 'ondra'`.

**Tech Stack:** Angular 19, Angular Material Dialog, Signals, `MAT_DIALOG_DATA`.

---

## Task 1: ClientDialogComponent — modo edición

**Files:**
- Modify: `src/app/modules/admin/pages/clients/client-dialog.component.ts`

### Contexto

El componente actualmente:
- Solo tiene modo creación (llama a `service.create()`)
- Nunca inyecta `MAT_DIALOG_DATA` (ignora el cliente que se le pasa)
- El título siempre dice "Nuevo cliente"

`clients-page.component.ts:46` ya pasa `data: { client }` al abrir el dialog de edición — solo falta que el dialog lo reciba.

### Step 1: Reemplazar `client-dialog.component.ts` con la versión dual-mode

Reemplazar el archivo completo con:

```typescript
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
    nombre:    [this.data?.client?.nombre    ?? "", Validators.required],
    slug:      [this.data?.client?.slug      ?? "", [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    prtg_group:[this.data?.client?.prtg_group ?? "", Validators.required],
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
      const { nombre, prtg_group } = this.form.getRawValue();
      this.service
        .update(this.data!.client!.id, { nombre: nombre!, prtg_group: prtg_group! })
        .subscribe({
          next:  (c) => this.dialogRef.close(c),
          error: (err) => {
            this.loading.set(false);
            this.error.set(err?.error?.error ?? "Error al guardar los cambios.");
          },
        });
    } else {
      const { nombre, slug, prtg_group } = this.form.getRawValue();
      this.service
        .create({ nombre: nombre!, slug: slug!, prtg_group: prtg_group! })
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
```

### Step 2: Verificar manualmente en el navegador

1. Abrir `http://localhost:4200/admin/clients`
2. Click en los tres puntos de cualquier cliente → "Editar"
3. Verificar que el dialog se abre con el nombre, slug y grupo PRTG pre-cargados
4. Verificar que el campo slug está deshabilitado
5. Cambiar el nombre → "Guardar cambios" → confirmar que el cambio se refleja en la tabla
6. Click en "Nuevo cliente" → verificar que el dialog abre vacío con todos los campos editables

### Step 3: Commit

```bash
cd e:/develop/dashboardViewer-frontend
git add src/app/modules/admin/pages/clients/client-dialog.component.ts
git commit -m "fix(admin): dialog de edición de cliente carga datos y guarda cambios"
```

---

## Task 2: Protección del cliente ONDRA

**Files:**
- Modify: `src/app/modules/admin/pages/clients/clients-page.component.html`
- Modify: `src/app/modules/admin/pages/clients/clients-page.component.scss`

### Contexto

El cliente ONDRA tiene `slug === 'ondra'` (hardcodeado en el seed del backend). No debe ser editable, desactivable ni eliminable. Se debe mostrar un badge "Sistema" en lugar del menú de acciones.

### Step 1: Modificar la columna `acciones` en el template

Localizar el `<ng-container matColumnDef="acciones">` en `clients-page.component.html` (líneas 60-80) y reemplazarlo con:

```html
<ng-container matColumnDef="acciones">
  <th mat-header-cell *matHeaderCellDef></th>
  <td mat-cell *matCellDef="let c">
    <ng-container *ngIf="c.slug !== 'ondra'; else systemBadge">
      <button mat-icon-button [matMenuTriggerFor]="menu">
        <mat-icon>more_vert</mat-icon>
      </button>
      <mat-menu #menu="matMenu">
        <button mat-menu-item (click)="openEditClientDialog(c)">
          <mat-icon>edit</mat-icon> Editar
        </button>
        <button mat-menu-item (click)="toggleStatus(c)">
          <mat-icon>{{ c.activo ? 'block' : 'check_circle' }}</mat-icon>
          {{ c.activo ? 'Desactivar' : 'Activar' }}
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item class="menu-item--danger" (click)="deleteClient(c)">
          <mat-icon>delete</mat-icon> Eliminar
        </button>
      </mat-menu>
    </ng-container>
    <ng-template #systemBadge>
      <span class="system-badge">
        <mat-icon>lock</mat-icon> Sistema
      </span>
    </ng-template>
  </td>
</ng-container>
```

### Step 2: Agregar estilos del badge en `clients-page.component.scss`

Agregar al final del archivo:

```scss
// ── Badge cliente sistema (ONDRA) ───────────────────────────────────────────
.system-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--bg-hover);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;

  mat-icon {
    font-size: 13px;
    width: 13px;
    height: 13px;
  }
}
```

### Step 3: Verificar manualmente

1. En `http://localhost:4200/admin/clients`
2. El cliente ONDRA debe mostrar el badge "Sistema" con ícono de candado en lugar del menú
3. Los demás clientes deben seguir mostrando el menú de tres puntos normalmente

### Step 4: Commit

```bash
cd e:/develop/dashboardViewer-frontend
git add src/app/modules/admin/pages/clients/clients-page.component.html
git add src/app/modules/admin/pages/clients/clients-page.component.scss
git commit -m "fix(admin): ocultar acciones del cliente ONDRA (cliente sistema)"
```

---

## Task 3: Push a main

### Step 1: Merge develop → main y push en frontend

```bash
cd e:/develop/dashboardViewer-frontend
git checkout main
git merge --no-ff develop -m "Merge develop: fix dialog edición clientes + protección ONDRA"
git push origin main
git checkout develop
```
