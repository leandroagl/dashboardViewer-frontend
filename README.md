# ONDRA Monitor — Frontend Angular 19

Portal de visualización de infraestructura para clientes de ONDRA Sistemas.

## Stack

- **Framework:** Angular 19 (módulos tradicionales, sin standalone)
- **UI:** Angular Material 19 — Dark theme personalizado
- **Estado reactivo:** Signals (Angular Signals API)
- **Tipografía:** DM Sans (body) + Space Mono (datos numéricos)
- **Paleta:** Fondo #0a0d12 · Superficie #111418 · Primario cyan #4dd0e1

---

## Estructura

```
src/app/
├── core/
│   ├── guards/        authGuard, adminGuard, passwordChangeGuard, noAuthGuard
│   ├── interceptors/  authInterceptor (JWT + refresh automático)
│   ├── models/        Tipos e interfaces (espejo del backend)
│   └── services/      AuthService, DashboardService, ClientsService, UsersService, LogsService
├── shared/
│   ├── components/
│   │   ├── status-badge/   Chip de color semántico por estado
│   │   ├── kpi-card/       Tarjeta numérica con acento de estado
│   │   ├── gauge/          Gauge semicircular SVG
│   │   ├── alert-list/     Lista de alertas activas
│   │   └── page-header/    Header de sección con icon + acciones
│   └── shared.module.ts
├── modules/
│   ├── auth/          Login + ChangePassword
│   ├── dashboard/     Layout + 4 dashboards (servers, backups, networking, windows) + SelectClient
│   └── admin/         Layout + Clients + Users + Logs
└── app.module.ts      Lazy loading de todos los módulos
```

---

## Decisiones de implementación

- **Señales (Signals):** `AuthService` usa `signal()` para estado de sesión. Componentes usan `signal()` para loading/data/error. Guards son `CanActivateFn` que leen señales.
- **Sin standalone:** Todos los componentes están declarados en NgModules.
- **Access token en memoria:** El `AuthService` guarda el token en un `signal` privado — nunca en localStorage/sessionStorage.
- **Refresh automático:** El `authInterceptor` intercepta 401s y reintenta con token renovado transparentemente.
- **Auto-refresh dashboards:** Cada página de dashboard tiene un `setInterval` de 60 segundos que recarga los datos.
- **Lazy loading:** Todos los módulos se cargan bajo demanda.

---

## Setup

```bash
npm install
npm start          # http://localhost:4200
npm run build:prod # Build de producción
```
