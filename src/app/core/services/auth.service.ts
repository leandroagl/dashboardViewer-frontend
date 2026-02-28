// ─── AuthService ──────────────────────────────────────────────────────────────
// Gestiona el estado de autenticación usando señales.
// El access token se guarda en memoria (nunca en localStorage).

import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';
import { AuthState, LoginResponse, RefreshResponse, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);

  // ─── Estado reactivo con señales ────────────────────────────────────────────

  private readonly _state = signal<AuthState>({
    accessToken:   null,
    nombre:        null,
    rol:           null,
    clienteSlug:   null,
    dashboards:    [],
    mustChangePwd: false,
  });

  // Señales derivadas (readonly para el resto de la app)
  readonly isAuthenticated = computed(() => !!this._state().accessToken);
  readonly currentUser     = computed(() => this._state());
  readonly nombre          = computed(() => this._state().nombre);
  readonly rol             = computed(() => this._state().rol);
  readonly clienteSlug     = computed(() => this._state().clienteSlug);
  readonly dashboards      = computed(() => this._state().dashboards);
  readonly mustChangePwd   = computed(() => this._state().mustChangePwd);
  readonly isAdmin         = computed(() => this._state().rol === 'admin_ondra');
  readonly accessToken     = computed(() => this._state().accessToken);

  // ─── Login ───────────────────────────────────────────────────────────────────

  login(email: string, password: string): Observable<ApiResponse<LoginResponse>> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${environment.apiUrl}/auth/login`, { email, password }, { withCredentials: true })
      .pipe(
        tap(res => {
          if (res.ok && res.data) {
            this._state.set({
              accessToken:   res.data.accessToken,
              nombre:        res.data.nombre,
              rol:           res.data.rol,
              clienteSlug:   res.data.clienteSlug,
              dashboards:    res.data.dashboardsDisponibles,
              mustChangePwd: res.data.mustChangePassword,
            });
          }
        })
      );
  }

  // ─── Refresh ─────────────────────────────────────────────────────────────────

  refresh(): Observable<ApiResponse<RefreshResponse>> {
    return this.http
      .post<ApiResponse<RefreshResponse>>(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        tap(res => {
          if (res.ok && res.data) {
            this._state.update(s => ({
              ...s,
              accessToken:   res.data!.accessToken,
              nombre:        res.data!.nombre,
              rol:           res.data!.rol,
              clienteSlug:   res.data!.clienteSlug,
              mustChangePwd: res.data!.mustChangePassword,
            }));
          }
        }),
        catchError(err => {
          this.clearState();
          return throwError(() => err);
        })
      );
  }

  // ─── Logout ──────────────────────────────────────────────────────────────────

  logout(): void {
    this.http
      .post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .subscribe({ complete: () => this.clearState() });
  }

  // ─── Cambio de contraseña ────────────────────────────────────────────────────

  changePassword(oldPassword: string, newPassword: string): Observable<ApiResponse<unknown>> {
    return this.http
      .post<ApiResponse<unknown>>(`${environment.apiUrl}/auth/change-password`, { oldPassword, newPassword })
      .pipe(
        tap(res => {
          if (res.ok) {
            // Después del cambio de contraseña se debe re-loguear
            this.clearState();
          }
        })
      );
  }

  // ─── Actualizar token (llamado desde el interceptor) ─────────────────────────

  setAccessToken(token: string): void {
    this._state.update(s => ({ ...s, accessToken: token }));
  }

  // ─── Utils ────────────────────────────────────────────────────────────────────

  private clearState(): void {
    this._state.set({ accessToken: null, rol: null, clienteSlug: null, dashboards: [], mustChangePwd: false });
    this.router.navigate(['/login']);
  }
}
