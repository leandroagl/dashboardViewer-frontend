# Design: Admin nav — submenú Dashboards + botón volver en Dashboard layout

**Fecha:** 2026-02-28
**Alcance:** Solo frontend (`dashboardViewer-frontend`)

---

## Contexto

El panel admin tiene un sidebar con tres ítems: Clientes, Usuarios, Logs. Los administradores `admin_ondra` no tienen `clienteSlug`, por lo que el enlace "Ver dashboards" del footer no les aparece. Se necesita:

1. Un submenú expandible en el sidebar que liste los clientes activos y permita navegar a sus dashboards.
2. Un botón sutil en la zona superior-izquierda del layout de dashboards para volver al panel admin.

---

## Diseño

### 1. Admin sidebar — submenú Dashboards con `mat-expansion-panel`

#### Archivos a modificar
- `src/app/modules/admin/admin.module.ts` — agregar `MatExpansionModule`
- `src/app/modules/admin/layout/admin-layout.component.ts` — cargar clientes activos
- `src/app/modules/admin/layout/admin-layout.component.html` — agregar panel
- `src/app/modules/admin/layout/admin-layout.component.scss` — estilos del panel

#### Lógica en `AdminLayoutComponent`
- Implementar `OnInit`
- Inyectar `ClientsService`
- Signal `clients = signal<Client[]>([])`
- En `ngOnInit()`: `clientsService.getAll().subscribe(cs => this.clients.set(cs.filter(c => c.activo)))`

#### Template — ubicación
El `mat-expansion-panel` se inserta en `<nav class="admin-sidebar__nav">`, después del ítem Logs:

```html
<mat-expansion-panel class="admin-sidebar__expand">
  <mat-expansion-panel-header class="admin-sidebar__item">
    <mat-icon>dashboard</mat-icon>
    <span>Dashboards</span>
  </mat-expansion-panel-header>

  <a *ngFor="let c of clients()"
     [routerLink]="'/' + c.slug + '/dashboards'"
     routerLinkActive="active"
     class="admin-sidebar__subitem">
    <mat-icon>open_in_new</mat-icon>
    <span>{{ c.nombre }}</span>
  </a>
</mat-expansion-panel>
```

#### Estilos clave
- El panel elimina el fondo y bordes propios de Material para integrarse al sidebar
- El header queda visualmente idéntico a los otros `admin-sidebar__item`
- Los sub-ítems (`admin-sidebar__subitem`) tienen un pequeño indent (16px) y fuente ligeramente menor

---

### 2. Dashboard layout — botón "← Admin" en top-left

#### Archivos a modificar
- `src/app/modules/dashboard/layout/dashboard-layout.component.html` — agregar botón en `dash-topbar__brand`
- `src/app/modules/dashboard/layout/dashboard-layout.component.scss` — estilos del botón

#### Template
Dentro de `<div class="dash-topbar__brand">`, con `*ngIf="isAdmin()"`:

```html
<a *ngIf="isAdmin()"
   routerLink="/admin/clients"
   class="dash-admin-back"
   matTooltip="Volver a Administración"
   mat-button>
  <mat-icon>arrow_back</mat-icon>
  <span>Admin</span>
</a>
```

#### Comportamiento
- Solo visible para `rol === 'admin_ondra'`
- Se muestra/oculta con la animación de `controlsVisible()` ya que está dentro de `.dash-topbar.controls-layer`
- El botón top-right existente (`admin_panel_settings`) se mantiene sin cambios

#### Estilos clave
- Opacity: 0.55 en reposo, 0.9 en hover
- Tipografía pequeña, icono tamaño 18px
- Color: texto secundario del tema (no blanco puro)

---

## Decisiones

| Decisión | Elección | Razón |
|---|---|---|
| Implementación submenú | `mat-expansion-panel` | Animación de Material, expandible/colapsable |
| Clientes en submenú | Solo activos (`activo=true`) | Los inactivos no tienen dashboards útiles |
| Botón admin en dashboard | Top-left + mantener top-right | Pedido explícito del usuario |
| Carga de clientes | `ngOnInit` una sola vez | Los clientes no cambian durante la sesión admin |

---

## Archivos impactados (resumen)

```
frontend/src/app/modules/admin/
  admin.module.ts                        ← +MatExpansionModule
  layout/admin-layout.component.ts       ← +OnInit, +ClientsService, +clients signal
  layout/admin-layout.component.html     ← +mat-expansion-panel en nav
  layout/admin-layout.component.scss     ← estilos del panel y sub-ítems

frontend/src/app/modules/dashboard/
  layout/dashboard-layout.component.html ← +botón admin en brand area
  layout/dashboard-layout.component.scss ← +estilos del botón
```
