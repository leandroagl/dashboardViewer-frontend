// ─── Interceptor de Autenticación ────────────────────────────────────────────
// Adjunta el access token a todos los requests al API propio.
// Si recibe 401, intenta renovar el token y reintentar.

import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '@env/environment';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);

  // Solo interceptar requests al API propio
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  // No agregar token a los endpoints públicos
  const publicPaths = ['/auth/login', '/auth/refresh'];
  if (publicPaths.some(p => req.url.includes(p))) {
    return next(req);
  }

  const token = authService.accessToken();
  const authReq = token ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Si el token expiró, intentar renovarlo una sola vez
      if (err.status === 401 && token) {
        return authService.refreshOnce().pipe(
          switchMap(res => {
            if (res.ok && res.data) {
              return next(addToken(req, res.data.accessToken));
            }
            return throwError(() => err);
          }),
          catchError(() => throwError(() => err))
        );
      }
      return throwError(() => err);
    })
  );
};

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
