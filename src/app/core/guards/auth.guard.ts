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

/**
 * Verifica que el slug de la ruta coincida con el cliente del usuario.
 * admin_ondra puede acceder a cualquier slug; los demás son redirigidos
 * silenciosamente a su propio slug si intentan acceder a otro.
 */
export const clientAccessGuard: CanActivateFn = (route) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isAdmin()) return true;

  const routeSlug = route.paramMap.get('slug');
  const userSlug  = auth.clienteSlug();

  if (!userSlug) { router.navigate(['/login']); return false; }
  if (routeSlug === userSlug) return true;

  router.navigate([`/${userSlug}/dashboards`]);
  return false;
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
