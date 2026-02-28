# Admin Nav: Dashboards submenu + botón volver Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Agregar un submenú expandible de clientes en el sidebar admin y un botón sutil "← Admin" en el layout de dashboards para usuarios admin.

**Architecture:** Dos cambios independientes en el frontend: (1) `AdminLayoutComponent` carga clientes activos y los muestra en un `mat-expansion-panel` en la nav; (2) `DashboardLayoutComponent` agrega un botón `← Admin` en `dash-topbar__brand` visible solo para `isAdmin()`.

**Tech Stack:** Angular 19, Angular Material (`mat-expansion-panel`), TypeScript Signals

---

## Task 1: Agregar `MatExpansionModule` al `AdminModule`

**Files:**
- Modify: `src/app/modules/admin/admin.module.ts`

**Step 1: Agregar el import de `MatExpansionModule`**

En `src/app/modules/admin/admin.module.ts`, agregar `MatExpansionModule` al array `MATERIAL`:

```typescript
import { MatExpansionModule } from '@angular/material/expansion';

// En el array MATERIAL (línea ~49):
const MATERIAL = [
  MatSidenavModule, MatListModule, MatTableModule, MatPaginatorModule,
  MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
  MatSlideToggleModule, MatMenuModule, MatChipsModule, MatDividerModule,
  MatSnackBarModule, MatProgressSpinnerModule, MatDatepickerModule, MatNativeDateModule,
  MatButtonModule, MatIconModule, MatTooltipModule,
  MatExpansionModule,   // ← agregar
];
```

**Step 2: Commit**

```bash
git add src/app/modules/admin/admin.module.ts
git commit -m "feat(admin): agregar MatExpansionModule para submenú de clientes"
```

---

## Task 2: Actualizar `AdminLayoutComponent` — cargar clientes activos

**Files:**
- Modify: `src/app/modules/admin/layout/admin-layout.component.ts`

**Step 1: Implementar carga de clientes activos**

Reemplazar el contenido de `admin-layout.component.ts` con:

```typescript
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { ClientsService } from '@core/services/clients.service';
import { Client } from '@core/models';

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-layout.component.html',
  styleUrls:   ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent implements OnInit {
  private readonly auth    = inject(AuthService);
  private readonly clients = inject(ClientsService);

  protected readonly clienteSlug     = this.auth.clienteSlug;
  protected readonly activeClients   = signal<Client[]>([]);

  ngOnInit(): void {
    this.clients.getAll().subscribe(list =>
      this.activeClients.set(list.filter(c => c.activo))
    );
  }

  protected logout(): void { this.auth.logout(); }
}
```

**Step 2: Commit**

```bash
git add src/app/modules/admin/layout/admin-layout.component.ts
git commit -m "feat(admin): cargar clientes activos en AdminLayoutComponent"
```

---

## Task 3: Template — agregar `mat-expansion-panel` en el sidebar

**Files:**
- Modify: `src/app/modules/admin/layout/admin-layout.component.html`

**Step 1: Agregar el panel expandible en la nav**

Reemplazar el contenido de `admin-layout.component.html` con:

```html
<div class="admin-shell">
  <aside class="admin-sidebar">
    <div class="admin-sidebar__brand">
      <mat-icon>admin_panel_settings</mat-icon>
      <div>
        <div class="admin-sidebar__brand-name">Administración</div>
        <div class="admin-sidebar__brand-sub">ONDRA Monitor</div>
      </div>
    </div>

    <mat-divider></mat-divider>

    <nav class="admin-sidebar__nav">
      <a routerLink="clients"  routerLinkActive="active" class="admin-sidebar__item">
        <mat-icon>business</mat-icon><span>Clientes</span>
      </a>
      <a routerLink="users"    routerLinkActive="active" class="admin-sidebar__item">
        <mat-icon>group</mat-icon><span>Usuarios</span>
      </a>
      <a routerLink="logs"     routerLinkActive="active" class="admin-sidebar__item">
        <mat-icon>history</mat-icon><span>Logs</span>
      </a>

      <!-- Submenú de dashboards por cliente -->
      <mat-expansion-panel class="sidebar-expand" *ngIf="activeClients().length > 0">
        <mat-expansion-panel-header class="sidebar-expand__header">
          <mat-panel-title>
            <mat-icon>dashboard</mat-icon>
            <span>Dashboards</span>
          </mat-panel-title>
        </mat-expansion-panel-header>

        <div class="sidebar-expand__body">
          <a *ngFor="let c of activeClients()"
             [routerLink]="'/' + c.slug + '/dashboards'"
             routerLinkActive="active"
             class="admin-sidebar__subitem">
            <mat-icon>open_in_new</mat-icon>
            <span>{{ c.nombre }}</span>
          </a>
        </div>
      </mat-expansion-panel>
    </nav>

    <div class="admin-sidebar__spacer"></div>

    <mat-divider></mat-divider>

    <div class="admin-sidebar__footer">
      <a *ngIf="clienteSlug()" [routerLink]="'/' + clienteSlug() + '/dashboards'" class="admin-sidebar__item">
        <mat-icon>dashboard</mat-icon><span>Ver dashboards</span>
      </a>
      <button class="admin-sidebar__item" (click)="logout()">
        <mat-icon>logout</mat-icon><span>Salir</span>
      </button>
    </div>
  </aside>

  <main class="admin-content">
    <router-outlet></router-outlet>
  </main>
</div>
```

**Step 2: Commit**

```bash
git add src/app/modules/admin/layout/admin-layout.component.html
git commit -m "feat(admin): agregar expansion panel de dashboards en sidebar"
```

---

## Task 4: SCSS — estilos del `mat-expansion-panel` y sub-ítems

**Files:**
- Modify: `src/app/modules/admin/layout/admin-layout.component.scss`

**Step 1: Agregar estilos del panel expandible y sub-ítems**

Al final del archivo `admin-layout.component.scss` (después de la línea 68 que cierra `.admin-content`), agregar:

```scss
// ─── Expansion panel de dashboards ────────────────────────────────────────────

.sidebar-expand {
  background:    transparent !important;
  box-shadow:    none !important;
  border-radius: var(--radius-md) !important;
  margin:        0 !important;

  // Anular separadores que añade Material entre paneles
  &::before, &::after { display: none !important; }

  ::ng-deep {
    .mat-expansion-panel-header {
      padding:       9px 12px !important;
      height:        auto !important;
      min-height:    0 !important;
      border-radius: var(--radius-md) !important;
      font-size:     13px;
      color:         var(--text-secondary);
      background:    transparent !important;
      transition:    background var(--transition), color var(--transition);

      &:hover { background: var(--bg-hover) !important; color: var(--text-primary); }

      .mat-expansion-panel-header-title {
        display:     flex;
        align-items: center;
        gap:         10px;
        color:       inherit;
        margin:      0;

        mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
      }

      .mat-expansion-indicator {
        color:   var(--text-secondary);
        opacity: 0.6;
      }
    }

    .mat-expansion-panel-content { overflow: visible; }
    .mat-expansion-panel-body    { padding: 4px 0 0 !important; }
  }
}

// ─── Sub-ítems (clientes) ─────────────────────────────────────────────────────

.admin-sidebar__subitem {
  display:         flex;
  align-items:     center;
  gap:             10px;
  padding:         7px 12px 7px 28px;
  border-radius:   var(--radius-md);
  color:           var(--text-muted);
  text-decoration: none;
  font-size:       12px;
  cursor:          pointer;
  transition:      background var(--transition), color var(--transition);

  mat-icon { font-size: 15px; width: 15px; height: 15px; flex-shrink: 0; }

  &:hover  { background: var(--bg-hover);       color: var(--text-primary); }
  &.active { background: var(--color-primary-dim); color: var(--color-primary); }
}
```

**Step 2: Verificar visualmente** — ejecutar `npm start` y navegar a `/admin`. El ítem "Dashboards" debe aparecer entre Logs y el spacer; al hacer click debe expandirse mostrando los clientes.

**Step 3: Commit**

```bash
git add src/app/modules/admin/layout/admin-layout.component.scss
git commit -m "feat(admin): estilos para expansion panel y sub-ítems de clientes"
```

---

## Task 5: Botón "← Admin" en el layout de dashboards

**Files:**
- Modify: `src/app/modules/dashboard/layout/dashboard-layout.component.html`
- Modify: `src/app/modules/dashboard/layout/dashboard-layout.component.scss`

**Step 1: Agregar el botón en `dash-topbar__brand`**

En `dashboard-layout.component.html`, reemplazar la línea:

```html
<div class="dash-topbar__brand"></div>
```

Por:

```html
<div class="dash-topbar__brand">
  <a *ngIf="isAdmin()"
     routerLink="/admin/clients"
     class="dash-admin-back"
     matTooltip="Volver a Administración"
     aria-label="Volver a Administración">
    <mat-icon>arrow_back</mat-icon>
    <span>Admin</span>
  </a>
</div>
```

**Step 2: Agregar estilos del botón en el SCSS**

Al final de `dashboard-layout.component.scss` (después del bloque `.dash-loading`), agregar:

```scss
// ─── Botón volver a admin (top-left) ──────────────────────────────────────────

.dash-admin-back {
  display:         flex;
  align-items:     center;
  gap:             5px;
  color:           rgba(255,255,255,0.45) !important;
  font-size:       12px;
  font-weight:     500;
  letter-spacing:  0.04em;
  text-decoration: none;
  padding:         4px 10px 4px 6px;
  border-radius:   var(--radius-sm);
  transition:      color var(--transition), background var(--transition);

  mat-icon {
    font-size: 16px;
    width:     16px;
    height:    16px;
  }

  &:hover {
    color:      rgba(255,255,255,0.9) !important;
    background: rgba(255,255,255,0.06);
  }
}
```

**Step 3: Verificar visualmente** — navegar a un dashboard como usuario `admin_ondra`. En la esquina superior izquierda debe aparecer "← Admin", que se oculta con la animación de inactividad y al hacer click lleva a `/admin/clients`.

**Step 4: Commit**

```bash
git add src/app/modules/dashboard/layout/dashboard-layout.component.html \
        src/app/modules/dashboard/layout/dashboard-layout.component.scss
git commit -m "feat(dashboard): agregar botón volver a admin en top-left para usuarios admin"
```

---

## Task 6: Merge y push

```bash
# Desde la rama develop del frontend
git checkout main
git merge --no-ff develop -m "feat: submenú dashboards en admin sidebar + botón admin en dashboard layout"
git push origin main
```

---

## Verificación final

- [ ] En `/admin`, el ítem "Dashboards" aparece en la nav entre Logs y el spacer
- [ ] Al hacer click en "Dashboards" se expande mostrando los clientes activos
- [ ] Cada cliente en la lista lleva a `/{slug}/dashboards`
- [ ] El cliente activo en la lista tiene highlight con el color primario
- [ ] En cualquier dashboard como `admin_ondra`: botón "← Admin" visible en top-left
- [ ] El botón "← Admin" se oculta/muestra con la animación de controles por inactividad
- [ ] El botón top-right de admin (`admin_panel_settings`) sigue funcionando
- [ ] Como usuario no-admin: el botón "← Admin" NO aparece
