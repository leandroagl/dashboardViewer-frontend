# Sucursales Dashboard — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a new "Sucursales" dashboard that shows VPN connectivity status for all branch offices, fetching ping sensors from the PRTG "Sucursales" leaf group.

**Architecture:** Backend adds `getSucursalesDashboard()` using the same `filterByLeafGroup` pattern as switches/PTP. Frontend adds a new `SucursalesPageComponent` (grid of status cards, offline-first). The dashboard auto-detects via `GROUP_MAP` without DB changes.

**Tech Stack:** Node.js/Express/TypeScript (backend), Angular 19 / Angular Material / SCSS BEM (frontend)

---

## Guía de patrones del proyecto

- **Backend pattern:** todo en `dashboards.service.ts` → `dashboards.controller.ts` → `dashboards.router.ts`
- **Frontend pattern:** extender `BaseDashboardPage<T>` con `ChangeDetectionStrategy.OnPush`, `standalone: false`
- **Commit backend:** directo en `main`
- **Commit frontend:** en `develop`, luego merge `--no-ff` a `main`, luego push

---

## Task 1: Backend — Interfaces y función `getSucursalesDashboard`

**Files:**
- Modify: `e:\develop\dashboardViewer-backend\src\modules\dashboards\dashboards.service.ts`

### Step 1: Agregar `'sucursales'` a `DashboardType` y `GROUP_MAP`

Localizar las líneas 1-7 del archivo (la definición de `DashboardType` y `GROUP_MAP`):

```typescript
export type DashboardType = "servers" | "backups" | "networking" | "windows";

const GROUP_MAP: { pattern: RegExp; type: DashboardType }[] = [
  { pattern: /^servers?$/i,                          type: "servers"    },
  { pattern: /^(backups?|veeam)$/i,                  type: "backups"    },
  { pattern: /^(networking|network|mikrotik)$/i,     type: "networking" },
  { pattern: /^(windows?\s*server|windows|wmi)$/i,   type: "windows"    },
];
```

Reemplazarlas con:

```typescript
export type DashboardType = "servers" | "backups" | "networking" | "windows" | "sucursales";

const GROUP_MAP: { pattern: RegExp; type: DashboardType }[] = [
  { pattern: /^servers?$/i,                          type: "servers"    },
  { pattern: /^(backups?|veeam)$/i,                  type: "backups"    },
  { pattern: /^(networking|network|mikrotik)$/i,     type: "networking" },
  { pattern: /^(windows?\s*server|windows|wmi)$/i,   type: "windows"    },
  { pattern: /^sucursales?$/i,                       type: "sucursales" },
];
```

### Step 2: Agregar interfaces y función al final del archivo

Al final del archivo (después de la función `getWindowsDashboard`), agregar:

```typescript
// ─── Dashboard: Sucursales ────────────────────────────────────────────────────
export interface SucursalDevice {
  name:    string;
  status:  SensorStatus;
  latency: string | null;
  message: string;
}

export interface SucursalesDashboard {
  sucursales:   SucursalDevice[];
  onlineCount:  number;
  offlineCount: number;
  alerts:       { name: string; message: string; status: SensorStatus }[];
}

export async function getSucursalesDashboard(prtgGroup: string, extraProbes: string[] = []): Promise<SucursalesDashboard> {
  const cacheKey = `sucursales:${prtgGroup}`;
  const cached = getCached<SucursalesDashboard>(cacheKey, CACHE_TTL_MS);
  if (cached) return cached;

  const all     = await getSensorsByGroup(prtgGroup, extraProbes);
  const sensors = filterByLeafGroup(all, /^sucursales?$/i);

  const deviceMap = new Map<string, PrtgSensor[]>();
  for (const s of sensors) {
    const key = s.device || s.name;
    if (!deviceMap.has(key)) deviceMap.set(key, []);
    deviceMap.get(key)!.push(s);
  }

  const sucursales: SucursalDevice[] = [...deviceMap.entries()].map(([name, deviceSensors]) => {
    const worstRaw   = Math.max(...deviceSensors.map(s => s.status_raw));
    const status     = normalizePrtgStatus(worstRaw);
    const pingSensor = deviceSensors.find(s => /ping/i.test(s.name)) ?? deviceSensors[0];
    const latency    = (status === 'ok' || status === 'warning') && pingSensor?.lastvalue
      ? pingSensor.lastvalue
      : null;
    return {
      name,
      status,
      latency,
      message: pingSensor?.message ?? '',
    };
  });

  // Ordenar: offline/error primero
  const statusOrder: Record<SensorStatus, number> = {
    error: 0, unknown: 1, warning: 2, unusual: 3, paused: 4, ok: 5,
  };
  sucursales.sort((a, b) => (statusOrder[a.status] ?? 6) - (statusOrder[b.status] ?? 6));

  const onlineCount  = sucursales.filter(s => s.status === 'ok').length;
  const offlineCount = sucursales.filter(s => s.status !== 'ok' && s.status !== 'warning').length;

  const alerts = sensors
    .filter(s => [4, 5, 13, 14].includes(s.status_raw))
    .map(s => ({ name: s.name, message: s.message, status: normalizePrtgStatus(s.status_raw) }));

  const result: SucursalesDashboard = { sucursales, onlineCount, offlineCount, alerts };
  setCache(cacheKey, result);
  return result;
}
```

### Step 3: Verificar que compila

```bash
cd e:/develop/dashboardViewer-backend && npm run build 2>&1 | tail -20
```

Expected: sin errores de TypeScript.

### Step 4: Commit backend parcial

```bash
cd e:/develop/dashboardViewer-backend
git add src/modules/dashboards/dashboards.service.ts
git commit -m "feat(sucursales): agregar getSucursalesDashboard con interfaces y caché"
```

---

## Task 2: Backend — Controller y Router

**Files:**
- Modify: `e:\develop\dashboardViewer-backend\src\modules\dashboards\dashboards.controller.ts`
- Modify: `e:\develop\dashboardViewer-backend\src\modules\dashboards\dashboards.router.ts`

### Step 1: Agregar `getSucursales` al controller

Al final de `dashboards.controller.ts` (después de `getWindows`), agregar:

```typescript
/** GET /:clientSlug/dashboards/sucursales */
export async function getSucursales(req: Request, res: Response): Promise<void> {
  const ip = getClientIp(req);
  try {
    const access = await resolveClientAccess(req, res);
    if (!access) return;

    const data = await DashboardsService.getSucursalesDashboard(access.prtgGroup, access.extraProbes);

    await audit({ usuario_id: req.user!.sub, email: req.user!.email, cliente_id: access.clienteId,
      accion: AuditAction.DASHBOARD_VIEW, dashboard: 'sucursales', ip_origen: ip, resultado: AuditResult.OK });

    sendOk(res, data);
  } catch (err) {
    logger.error('Error en dashboard sucursales', { error: err });
    sendServerError(res);
  }
}
```

### Step 2: Agregar ruta en el router

En `dashboards.router.ts`, agregar la ruta después de `/windows`:

```typescript
router.get('/sucursales', DashboardsController.getSucursales);
```

El bloque de rutas quedará:
```typescript
router.get('/',            DashboardsController.getAvailable);
router.get('/servers',     DashboardsController.getServers);
router.get('/backups',     DashboardsController.getBackups);
router.get('/networking',  DashboardsController.getNetworking);
router.get('/windows',     DashboardsController.getWindows);
router.get('/sucursales',  DashboardsController.getSucursales);
```

### Step 3: Verificar build completo

```bash
cd e:/develop/dashboardViewer-backend && npm run build 2>&1 | tail -20
```

Expected: sin errores.

### Step 4: Commit y push backend

```bash
cd e:/develop/dashboardViewer-backend
git add src/modules/dashboards/dashboards.controller.ts src/modules/dashboards/dashboards.router.ts
git commit -m "feat(sucursales): agregar endpoint GET /sucursales al controller y router"
git push origin main
```

---

## Task 3: Frontend — Modelos y DashboardService

**Files:**
- Modify: `e:\develop\dashboardViewer-frontend\src\app\core\models\index.ts`
- Modify: `e:\develop\dashboardViewer-frontend\src\app\core\services\dashboard.service.ts`

### Step 1: Actualizar `DashboardType` en models/index.ts

Localizar la línea:
```typescript
export type DashboardType = 'servers' | 'backups' | 'networking' | 'windows';
```

Reemplazar con:
```typescript
export type DashboardType = 'servers' | 'backups' | 'networking' | 'windows' | 'sucursales';
```

### Step 2: Agregar interfaces de Sucursales en models/index.ts

Después del bloque `// Windows` y antes de `// ─── Logs`, agregar:

```typescript
// Sucursales
export interface SucursalDevice {
  name:    string;
  status:  SensorStatus;
  latency: string | null;
  message: string;
}
export interface SucursalesDashboard {
  sucursales:   SucursalDevice[];
  onlineCount:  number;
  offlineCount: number;
  alerts:       { name: string; message: string; status: SensorStatus }[];
}
```

### Step 3: Agregar `getSucursales()` al DashboardService

En `dashboard.service.ts`, agregar el import de `SucursalesDashboard`:

```typescript
import {
  ApiResponse, DashboardType,
  VmwareDashboard, BackupsDashboard, NetworkingDashboard, WindowsDashboard,
  SucursalesDashboard
} from '../models';
```

Y agregar el método al final de la clase:

```typescript
getSucursales(slug: string): Observable<SucursalesDashboard> {
  return this.http.get<ApiResponse<SucursalesDashboard>>(this.url(slug, '/sucursales'))
    .pipe(map(requireData));
}
```

### Step 4: Actualizar `NAV_CONFIG` en dashboard-layout.component.ts

En `dashboard-layout.component.ts`, localizar el objeto `NAV_CONFIG` (línea 23):

```typescript
const NAV_CONFIG: Record<DashboardType, Omit<NavItem, 'type' | 'path'>> = {
  servers:    { label: 'Servidores', icon: 'dns'      },
  backups:    { label: 'Backups',    icon: 'backup'   },
  networking: { label: 'Networking', icon: 'router'   },
  windows:    { label: 'Windows',    icon: 'computer' },
};
```

Reemplazar con:

```typescript
const NAV_CONFIG: Record<DashboardType, Omit<NavItem, 'type' | 'path'>> = {
  servers:    { label: 'Servidores', icon: 'dns'           },
  backups:    { label: 'Backups',    icon: 'backup'        },
  networking: { label: 'Networking', icon: 'router'        },
  windows:    { label: 'Windows',    icon: 'computer'      },
  sucursales: { label: 'Sucursales', icon: 'location_city' },
};
```

### Step 5: Commit frontend modelos

```bash
cd e:/develop/dashboardViewer-frontend
git add src/app/core/models/index.ts src/app/core/services/dashboard.service.ts
git add src/app/modules/dashboard/layout/dashboard-layout.component.ts
git commit -m "feat(sucursales): agregar modelos, DashboardService.getSucursales y NAV_CONFIG"
```

---

## Task 4: Frontend — Componente SucursalesPageComponent

**Files:**
- Create: `e:\develop\dashboardViewer-frontend\src\app\modules\dashboard\pages\sucursales\sucursales-page.component.ts`
- Create: `e:\develop\dashboardViewer-frontend\src\app\modules\dashboard\pages\sucursales\sucursales-page.component.html`
- Create: `e:\develop\dashboardViewer-frontend\src\app\modules\dashboard\pages\sucursales\sucursales-page.component.scss`

### Step 1: Crear el directorio

```bash
mkdir -p "e:/develop/dashboardViewer-frontend/src/app/modules/dashboard/pages/sucursales"
```

### Step 2: Crear `sucursales-page.component.ts`

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardService } from '@core/services/dashboard.service';
import { SucursalesDashboard, SucursalDevice, SensorStatus } from '@core/models';
import { BaseDashboardPage } from '../base-dashboard-page';

@Component({
  selector:        'app-sucursales-page',
  standalone:      false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:     './sucursales-page.component.html',
  styleUrls:       ['./sucursales-page.component.scss'],
})
export class SucursalesPageComponent extends BaseDashboardPage<SucursalesDashboard> {
  private readonly service = inject(DashboardService);

  protected fetchData(slug: string): Observable<SucursalesDashboard> {
    return this.service.getSucursales(slug);
  }

  // ─── Helpers para el template ────────────────────────────────────────────────

  protected onlineStatus(d: SucursalesDashboard): SensorStatus {
    return d.offlineCount === 0 ? 'ok' : 'ok';
  }

  protected offlineStatus(d: SucursalesDashboard): SensorStatus {
    return d.offlineCount > 0 ? 'error' : 'ok';
  }

  protected connectivityPct(d: SucursalesDashboard): number {
    if (d.sucursales.length === 0) return 0;
    return Math.round((d.onlineCount / d.sucursales.length) * 100);
  }

  protected connectivityStatus(d: SucursalesDashboard): SensorStatus {
    const pct = this.connectivityPct(d);
    if (pct >= 90) return 'ok';
    if (pct >= 70) return 'warning';
    return 'error';
  }

  protected sucIcon(status: SensorStatus): string {
    if (status === 'ok')      return 'location_on';
    if (status === 'warning') return 'wifi_find';
    return 'wifi_off';
  }

  protected sucStatusText(status: SensorStatus): string {
    if (status === 'ok')      return 'En línea';
    if (status === 'warning') return 'Inestable';
    if (status === 'paused')  return 'Pausado';
    return 'Sin conexión';
  }

  protected truncateMessage(msg: string): string {
    const clean = msg.replace(/<[^>]+>/g, '').trim();
    return clean.length > 50 ? clean.slice(0, 50) + '…' : clean;
  }
}
```

### Step 3: Crear `sucursales-page.component.html`

```html
<div class="sucursales-page fade-in-up" *ngIf="!loading(); else loadingTpl">
  <app-page-header title="Sucursales" icon="location_city"
    subtitle="Conectividad VPN de puntos de venta">
  </app-page-header>

  <ng-container *ngIf="data() as d">

    <!-- KPI strip -->
    <div class="suc-kpis">
      <app-kpi-card label="Total"        [value]="d.sucursales.length"     status="ok"                       sublabel="sucursales"></app-kpi-card>
      <app-kpi-card label="En línea"     [value]="d.onlineCount"           [status]="onlineStatus(d)"        sublabel="conectadas"></app-kpi-card>
      <app-kpi-card label="Sin conexión" [value]="d.offlineCount"          [status]="offlineStatus(d)"       sublabel="VPN caída"></app-kpi-card>
      <app-kpi-card label="Conectividad" [value]="connectivityPct(d) + '%'" [status]="connectivityStatus(d)" sublabel="disponibilidad"></app-kpi-card>
    </div>

    <!-- Grid de tarjetas -->
    <div class="suc-grid" *ngIf="d.sucursales.length > 0; else emptyState">
      <div *ngFor="let suc of d.sucursales"
           class="suc-card suc-card--{{ suc.status }}">
        <span class="suc-card__dot suc-card__dot--{{ suc.status }}"></span>
        <div class="suc-card__body">
          <mat-icon class="suc-card__icon">{{ sucIcon(suc.status) }}</mat-icon>
          <div class="suc-card__name">{{ suc.name }}</div>
          <div class="suc-card__status-text">{{ sucStatusText(suc.status) }}</div>
          <div class="suc-card__latency mono">{{ suc.latency ?? '---' }}</div>
          <div class="suc-card__message" *ngIf="suc.message">
            {{ truncateMessage(suc.message) }}
          </div>
        </div>
      </div>
    </div>

    <ng-template #emptyState>
      <div class="empty-state">
        <mat-icon>info</mat-icon> Sin sucursales configuradas
      </div>
    </ng-template>

  </ng-container>
</div>

<ng-template #loadingTpl>
  <div class="loading-state">
    <div class="skeleton" style="height: 32px; width: 200px; margin-bottom: 24px;"></div>
    <div class="skeleton" style="height: 80px; margin-bottom: 16px;"></div>
    <div class="suc-grid">
      <div class="skeleton" style="height: 140px;"></div>
      <div class="skeleton" style="height: 140px;"></div>
      <div class="skeleton" style="height: 140px;"></div>
      <div class="skeleton" style="height: 140px;"></div>
      <div class="skeleton" style="height: 140px;"></div>
      <div class="skeleton" style="height: 140px;"></div>
    </div>
  </div>
</ng-template>
```

### Step 4: Crear `sucursales-page.component.scss`

```scss
.sucursales-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// ─── KPI strip ────────────────────────────────────────────────────────────────

.suc-kpis {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

// ─── Grid de tarjetas ─────────────────────────────────────────────────────────

.suc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

// ─── Tarjeta de sucursal ──────────────────────────────────────────────────────

.suc-card {
  position: relative;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  border-left-width: 3px;
  background: var(--bg-surface);
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  min-height: 140px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }

  // ── Variantes por status ────────────────────────────────────────────────────
  &--ok {
    border-left-color: var(--status-ok);
    background: color-mix(in srgb, var(--status-ok) 5%, var(--bg-surface));
  }
  &--warning {
    border-left-color: var(--status-warning);
    background: color-mix(in srgb, var(--status-warning) 5%, var(--bg-surface));
  }
  &--error, &--unknown {
    border-left-color: var(--status-error);
    background: color-mix(in srgb, var(--status-error) 6%, var(--bg-surface));
  }
  &--paused {
    border-left-color: var(--status-paused);
    opacity: 0.7;
  }

  // ── Contenido ───────────────────────────────────────────────────────────────
  &__body {
    padding: 14px 12px 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 4px;
  }

  &__icon {
    font-size: 28px;
    width: 28px;
    height: 28px;
    margin-bottom: 2px;

    .suc-card--ok &      { color: var(--status-ok); }
    .suc-card--warning & { color: var(--status-warning); }
    .suc-card--error &,
    .suc-card--unknown & { color: var(--status-error); }
    .suc-card--paused &  { color: var(--status-paused); }
  }

  &__name {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.3;
    word-break: break-word;
    max-width: 100%;
  }

  &__status-text {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-transform: uppercase;

    .suc-card--ok &      { color: var(--status-ok); }
    .suc-card--warning & { color: var(--status-warning); }
    .suc-card--error &,
    .suc-card--unknown & { color: var(--status-error); }
    .suc-card--paused &  { color: var(--status-paused); }
  }

  &__latency {
    font-size: 12px;
    color: var(--text-secondary);
  }

  &__message {
    font-size: 10px;
    color: var(--text-muted);
    line-height: 1.3;
    word-break: break-word;
  }
}

// ─── Dot indicador (esquina superior derecha) ─────────────────────────────────

@keyframes suc-pulse {
  0%, 100% { opacity: 1;   transform: scale(1);   }
  50%       { opacity: 0.5; transform: scale(1.4); }
}

.suc-card__dot {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;

  &--ok      { background: var(--status-ok);      box-shadow: 0 0 6px var(--status-ok); }
  &--warning { background: var(--status-warning);  box-shadow: 0 0 6px var(--status-warning); }
  &--error,
  &--unknown { background: var(--status-error);    box-shadow: 0 0 6px var(--status-error); animation: suc-pulse 1.5s ease-in-out infinite; }
  &--paused  { background: var(--status-paused); }
}

// ─── Empty / Loading ──────────────────────────────────────────────────────────

.empty-state {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 13px;

  mat-icon { font-size: 18px; width: 18px; height: 18px; }
}

.loading-state {
  padding: 8px;
}
```

### Step 5: Verificar que no hay errores de TypeScript en los 3 archivos creados (revisión visual)

Confirmar que:
- El import de `BaseDashboardPage` usa path relativo `'../base-dashboard-page'`
- El import de modelos usa `@core/models` (alias configurado en tsconfig)
- El import de service usa `@core/services/dashboard.service`

---

## Task 5: Frontend — Registrar en DashboardModule y agregar ruta

**Files:**
- Modify: `e:\develop\dashboardViewer-frontend\src\app\modules\dashboard\dashboard.module.ts`

### Step 1: Agregar import y declaración

Agregar el import del componente:
```typescript
import { SucursalesPageComponent } from './pages/sucursales/sucursales-page.component';
```

Agregar en `declarations`:
```typescript
declarations: [
  DashboardLayoutComponent,
  SelectClientComponent,
  ServersPageComponent,
  BackupsPageComponent,
  NetworkingPageComponent,
  WindowsPageComponent,
  SucursalesPageComponent,    // ← agregar
],
```

### Step 2: Agregar la ruta

En el array `children` dentro de `routes`, agregar la nueva ruta:
```typescript
children: [
  { path: 'dashboards',              redirectTo: 'dashboards/servers', pathMatch: 'full' },
  { path: 'dashboards/servers',      component: ServersPageComponent },
  { path: 'dashboards/backups',      component: BackupsPageComponent },
  { path: 'dashboards/networking',   component: NetworkingPageComponent },
  { path: 'dashboards/windows',      component: WindowsPageComponent },
  { path: 'dashboards/sucursales',   component: SucursalesPageComponent },  // ← agregar
],
```

### Step 3: Verificar build del frontend

```bash
cd e:/develop/dashboardViewer-frontend && npm run build 2>&1 | tail -30
```

Expected: sin errores de compilación. Si hay errores de TypeScript, revisarlos y corregirlos.

### Step 4: Commit en develop y merge a main

```bash
cd e:/develop/dashboardViewer-frontend

# Commitear todos los cambios del frontend
git add src/app/core/models/index.ts
git add src/app/core/services/dashboard.service.ts
git add src/app/modules/dashboard/layout/dashboard-layout.component.ts
git add src/app/modules/dashboard/pages/sucursales/
git add src/app/modules/dashboard/dashboard.module.ts
git commit -m "feat(sucursales): agregar dashboard de sucursales con grilla de conectividad VPN"

# Merge a main y push
git checkout main
git merge --no-ff develop -m "merge(sucursales): integrar dashboard de sucursales desde develop"
git push origin main
git checkout develop
```

---

## Verificación final

Una vez desplegado, verificar en el navegador:

1. Navegar a `/{clientSlug}/dashboards/sucursales`
2. Confirmar que aparece la página con el grid de tarjetas
3. Si hay sucursales configuradas en PRTG bajo el leaf group "Sucursales", deben aparecer
4. Tarjetas offline (error/unknown) deben aparecer primero con el dot pulsante rojo
5. El dashboard debe aparecer automáticamente en la navegación del layout si el cliente tiene sucursales en PRTG

**Para clientes sin grupo "Sucursales" en PRTG:** El dashboard no aparecerá en la lista de disponibles (el `getAvailableDashboards` no lo detectará) — comportamiento correcto.

---

## Notas de implementación

- `color-mix(in srgb, ...)` requiere navegadores modernos (Chrome 111+, Firefox 113+). Si hay problemas de compatibilidad, reemplazar con `rgba()` con valor hardcoded.
- El mensaje PRTG (`message` field) contiene HTML: se limpia con `.replace(/<[^>]+>/g, '')` en `truncateMessage()`.
- `offlineCount` incluye status `error` y `unknown` (no `warning` ni `paused`). Ajustar según criterio del negocio.
