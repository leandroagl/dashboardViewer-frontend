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

Requiere que el backend esté corriendo en `http://localhost:3000` (configurable en `src/environments/`).

---

## Build de producción

```bash
npm run build:prod
```

Genera los archivos estáticos optimizados en `dist/ondra-monitor/`:

- Tree-shaking y minificación automáticos
- Hashing de archivos para cache-busting
- Presupuesto de tamaño: warning en 500 kB, error en 1 MB por bundle inicial

> El build no requiere ningún servidor Node.js para funcionar — produce archivos HTML/CSS/JS estáticos puros.

---

## Despliegue en Windows Server

La aplicación Angular compilada es un conjunto de archivos estáticos. Se puede servir con IIS (nativo de Windows Server) o con nginx para Windows.

### Opción A — IIS (recomendado en Windows Server)

#### Requisitos previos

- IIS habilitado en Windows Server (Roles y Características → Servidor web IIS)
- Módulo **URL Rewrite** instalado ([descargar](https://www.iis.net/downloads/microsoft/url-rewrite))

#### Pasos

1. **Compilar** la aplicación:
   ```powershell
   npm run build:prod
   ```

2. **Copiar** el contenido de `dist/ondra-monitor/browser/` a la carpeta del sitio IIS, por ejemplo:
   ```
   C:\inetpub\wwwroot\ondra-monitor\
   ```

3. **Crear el sitio** en IIS Manager apuntando a esa carpeta.

4. **Agregar `web.config`** en la raíz del sitio para que Angular Router funcione correctamente (todas las rutas deben servir `index.html`):

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <configuration>
     <system.webServer>
       <rewrite>
         <rules>
           <rule name="Angular SPA" stopProcessing="true">
             <match url=".*" />
             <conditions logicalGrouping="MatchAll">
               <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
               <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
             </conditions>
             <action type="Rewrite" url="/index.html" />
           </rule>
         </rules>
       </rewrite>
       <staticContent>
         <mimeMap fileExtension=".woff2" mimeType="font/woff2" />
       </staticContent>
     </system.webServer>
   </configuration>
   ```

5. **Configurar HTTPS** en IIS con un certificado SSL (Let's Encrypt via win-acme, o certificado corporativo).

---

### Opción B — nginx para Windows

#### Pasos

1. Descargar nginx para Windows desde https://nginx.org/en/download.html y descomprimir en, por ejemplo, `C:\nginx\`.

2. Copiar el contenido de `dist/ondra-monitor/browser/` a `C:\nginx\html\ondra-monitor\`.

3. Editar `C:\nginx\conf\nginx.conf`:

   ```nginx
   server {
       listen       80;
       server_name  monitor.ondra.com.ar;

       root   C:/nginx/html/ondra-monitor;
       index  index.html;

       # Angular Router: todas las rutas a index.html
       location / {
           try_files $uri $uri/ /index.html;
       }

       # Caché agresivo para assets con hash
       location ~* \.(js|css|woff2|ico|png|svg)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

4. Instalar nginx como servicio de Windows con [WinSW](https://github.com/winsw/winsw) o NSSM:

   ```powershell
   # Con NSSM (Non-Sucking Service Manager)
   nssm install nginx C:\nginx\nginx.exe
   nssm start nginx
   ```

---

### Actualización del frontend en producción

```powershell
# 1. Compilar la nueva versión
npm run build:prod

# 2. Reemplazar los archivos en la carpeta del servidor
#    (el hashing automático evita problemas de caché del navegador)
Copy-Item -Path "dist\ondra-monitor\browser\*" `
          -Destination "C:\inetpub\wwwroot\ondra-monitor\" `
          -Recurse -Force

# No se requiere reiniciar IIS ni nginx para cambios de frontend
```

---

## Variables de entorno de la aplicación

La URL del backend se configura en los archivos de environment de Angular:

```
src/environments/
├── environment.ts          # Desarrollo: http://localhost:3000
└── environment.prod.ts     # Producción: https://api.monitor.ondra.com.ar
```

Para cambiar la URL de producción, editar `environment.prod.ts` antes de compilar.
