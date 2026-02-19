// ─── Guards de Rutas ──────────────────────────────────────────────────────────

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Protege rutas privadas. Si no hay sesión, redirige a /login. */
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};

/** Si debe cambiar contraseña, redirige a /change-password. */
export const passwordChangeGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated() && auth.mustChangePwd()) {
    router.navigate(['/change-password']);
    return false;
  }
  return true;
};

/** Solo permite acceso a admin_ondra. */
export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.rol() !== 'admin_ondra') {
    const slug = auth.clienteSlug();
    router.navigate(slug ? [`/${slug}/dashboards`] : ['/login']);
    return false;
  }
  return true;
};

/** Si ya está autenticado, redirige fuera de /login. */
export const noAuthGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    redirectAfterLogin(auth, router);
    return false;
  }
  return true;
};

function redirectAfterLogin(auth: AuthService, router: Router): void {
  if (auth.mustChangePwd()) { router.navigate(['/change-password']); return; }
  if (auth.isAdmin())        { router.navigate(['/admin/clients']);    return; }
  const slug = auth.clienteSlug();
  if (slug) { router.navigate([`/${slug}/dashboards`]); return; }
  router.navigate(['/login']);
}
