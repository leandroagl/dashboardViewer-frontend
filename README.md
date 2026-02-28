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
│   │   ├── gauge/          Gauge semicircular SVG (responsive via CSS custom properties)
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
- **Gauge responsive:** El componente `GaugeComponent` expone `--gauge-w`, `--gauge-h`, `--gauge-font-value` y `--gauge-font-label` como CSS custom properties para que los componentes padre adapten el tamaño sin `::ng-deep`.

---

## Setup local (desarrollo)

```bash
npm install
npm start          # http://localhost:4200
```

Requiere que el backend esté corriendo. La URL se configura en `src/environments/environment.ts`.

---

## Build de producción

### 1. Verificar la URL del backend en `src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://monitor.ondra.com.ar/api',
};
```

El prefijo `/api` es necesario para que nginx pueda separar el tráfico de la API del frontend
sin ambigüedad (ver configuración nginx más abajo). Ajustar el dominio si es diferente.

### 2. Compilar

```bash
npm run build:prod
```

Genera los archivos estáticos en `dist/ondra-monitor/browser/`:
- Tree-shaking y minificación automáticos
- Hashing de archivos para cache-busting

---

## Despliegue en Windows Server

El frontend es un conjunto de archivos estáticos servido por **nginx**. El mismo servidor
corre el backend Node.js (ver README del backend). nginx actúa como:

- Servidor de archivos estáticos del frontend (SPA Angular)
- Reverse proxy hacia el backend en `localhost:3000`

```
Navegador  →  nginx :443  →  /api/*  →  Node.js :3000
                          →  /*      →  dist/ (Angular SPA)
```

### Requisitos previos

| Componente | Instalación |
|------------|-------------|
| nginx para Windows | https://nginx.org/en/download.html |
| NSSM | https://nssm.cc/download (para nginx como servicio) |
| Certificado SSL | Corporativo o Let's Encrypt vía win-acme |

### 1. Instalar nginx

Descargar nginx para Windows y descomprimir en:

```
C:\apps\nginx\
```

Verificar:

```powershell
C:\apps\nginx\nginx.exe -v
```

### 2. Ubicar los archivos del frontend

Copiar el contenido de `dist/ondra-monitor/browser/` al servidor:

```
C:\apps\ondra-monitor\frontend\
```

Estructura resultante en el servidor:

```
C:\apps\ondra-monitor\
├── backend\          ← código y dist/ del backend Node.js
└── frontend\         ← archivos estáticos del build Angular
    ├── index.html
    ├── main.<hash>.js
    └── ...
```

### 3. Configurar nginx

Reemplazar el contenido de `C:\apps\nginx\conf\nginx.conf`:

```nginx
worker_processes 1;

events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile      on;
    keepalive_timeout 65;

    # Redirigir HTTP → HTTPS
    server {
        listen 80;
        server_name monitor.ondra.com.ar;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        server_name monitor.ondra.com.ar;

        ssl_certificate     C:/apps/nginx/ssl/cert.pem;
        ssl_certificate_key C:/apps/nginx/ssl/key.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;

        root  C:/apps/ondra-monitor/frontend;
        index index.html;

        # ── Backend API (proxy al proceso Node.js) ─────────────────────────
        # nginx strip el prefijo /api antes de enviar al backend.
        # Ejemplo: GET /api/auth/login  →  GET /auth/login  en localhost:3000
        location /api/ {
            proxy_pass         http://127.0.0.1:3000/;
            proxy_http_version 1.1;
            proxy_set_header   Host              $host;
            proxy_set_header   X-Real-IP         $remote_addr;
            proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
            proxy_set_header   X-Forwarded-Proto $scheme;
            proxy_read_timeout 30s;
        }

        # ── Assets estáticos con caché largo ──────────────────────────────
        location ~* \.(js|css|woff2|woff|ttf|ico|png|svg|webp)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            try_files $uri =404;
        }

        # ── Angular SPA: todo lo demás devuelve index.html ─────────────────
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

> **Certificados SSL:** Colocar `cert.pem` y `key.pem` en `C:\apps\nginx\ssl\`.
> Para Let's Encrypt en Windows usar win-acme: https://www.win-acme.com

### 4. Verificar la configuración y arrancar nginx

```powershell
# Verificar sintaxis
C:\apps\nginx\nginx.exe -t

# Iniciar
C:\apps\nginx\nginx.exe

# Recargar configuración sin bajar el servicio (tras cambios en nginx.conf)
C:\apps\nginx\nginx.exe -s reload
```

### 5. Instalar nginx como servicio de Windows con NSSM

Para que nginx arranque automáticamente con el sistema operativo:

```powershell
# Instalar el servicio
nssm install nginx "C:\apps\nginx\nginx.exe"

# Configurar directorio de trabajo (necesario para que nginx encuentre conf/)
nssm set nginx AppDirectory "C:\apps\nginx"

# Iniciar el servicio
nssm start nginx

# Verificar estado
nssm status nginx
```

Comandos útiles para operación:

```powershell
nssm start nginx    # iniciar
nssm stop nginx     # detener
nssm restart nginx  # reiniciar (tras cambios en nginx.conf)
nssm status nginx   # estado
```

### 6. Verificar el sistema completo

Con ambos servicios corriendo (PM2 para el backend, nginx para el frontend):

1. Abrir `https://monitor.ondra.com.ar` en el navegador
2. Verificar que carga la pantalla de login
3. Iniciar sesión con el usuario admin creado en el seed
4. Confirmar que los dashboards cargan datos de PRTG

Health check del backend:

```
GET https://monitor.ondra.com.ar/api/health
→ { "ok": true, "version": "1.0.0", "timestamp": "..." }
```

---

## Actualización del frontend en producción

```powershell
# 1. Compilar la nueva versión (en el equipo de desarrollo)
npm run build:prod

# 2. Copiar dist/ondra-monitor/browser/ al servidor
Copy-Item -Path "dist\ondra-monitor\browser\*" `
          -Destination "C:\apps\ondra-monitor\frontend\" `
          -Recurse -Force

# No es necesario reiniciar nginx para cambios de frontend
# (los hashes de archivos evitan problemas de caché del navegador)
```

---

## Variables de entorno de la aplicación

La URL del backend se configura en `src/environments/`:

| Archivo | Entorno | URL de ejemplo |
|---------|---------|----------------|
| `environment.ts` | Desarrollo | `http://192.168.x.x:3000` |
| `environment.prod.ts` | Producción | `https://monitor.ondra.com.ar/api` |

Cambiar `environment.prod.ts` antes de compilar si el dominio es diferente.
