// ─── AppModule ────────────────────────────────────────────────────────────────
// Módulo raíz de la aplicación. Usa lazy loading para todos los módulos.

import { inject, NgModule } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import {
  HttpClientModule,
  provideHttpClient,
  withInterceptors,
} from "@angular/common/http";
import { RouterModule, Routes } from "@angular/router";

import { authInterceptor } from "@core/interceptors/auth.interceptor";
import { AppComponent } from "./app.component";
import { provideAppInitializer } from "@angular/core";
import { AuthService } from "@core/services/auth.service";

const routes: Routes = [
  { path: "", redirectTo: "/login", pathMatch: "full" },

  // Auth (login, change-password)
  {
    path: "",
    loadChildren: () =>
      import("./modules/auth/auth.module").then((m) => m.AuthModule),
  },

  // Panel de administración
  {
    path: "admin",
    loadChildren: () =>
      import("./modules/admin/admin.module").then((m) => m.AdminModule),
  },

  // Dashboards: select-client + /:slug/dashboards/...
  {
    path: "",
    loadChildren: () =>
      import("./modules/dashboard/dashboard.module").then(
        (m) => m.DashboardModule,
      ),
  },

  { path: "**", redirectTo: "/login" },
];

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes, { scrollPositionRestoration: "enabled" }),
  ],
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      return firstValueFrom(auth.refresh()).catch(() => {});
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
