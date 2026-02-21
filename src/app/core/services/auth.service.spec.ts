import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';
import { environment } from '@env/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
    });
    service = TestBed.inject(AuthService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // ─── Estado inicial ─────────────────────────────────────────────────────────

  it('starts unauthenticated', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.accessToken()).toBeNull();
    expect(service.rol()).toBeNull();
  });

  it('isAdmin is false when not authenticated', () => {
    expect(service.isAdmin()).toBe(false);
  });

  // ─── login ──────────────────────────────────────────────────────────────────

  it('sets state after successful login', () => {
    service.login('admin@test.com', 'pass').subscribe();

    const req = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'admin@test.com', password: 'pass' });

    req.flush({
      ok: true,
      data: {
        accessToken:           'tok_abc',
        rol:                   'admin_ondra',
        clienteSlug:           'acme',
        dashboardsDisponibles: ['servers'],
        mustChangePassword:    false,
      },
    });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.accessToken()).toBe('tok_abc');
    expect(service.isAdmin()).toBe(true);
    expect(service.clienteSlug()).toBe('acme');
    expect(service.mustChangePwd()).toBe(false);
  });

  it('stays unauthenticated when login response is not ok', () => {
    service.login('x@x.com', 'wrong').subscribe();

    http.expectOne(`${environment.apiUrl}/auth/login`).flush({ ok: false });

    expect(service.isAuthenticated()).toBe(false);
  });

  // ─── setAccessToken ──────────────────────────────────────────────────────────

  it('updates accessToken signal via setAccessToken', () => {
    service.setAccessToken('new_token');
    expect(service.accessToken()).toBe('new_token');
  });

  // ─── refresh ────────────────────────────────────────────────────────────────

  it('updates accessToken after successful refresh', () => {
    service.setAccessToken('old_token');

    service.refresh().subscribe();

    const req = http.expectOne(`${environment.apiUrl}/auth/refresh`);
    req.flush({ ok: true, data: { accessToken: 'refreshed_token' } });

    expect(service.accessToken()).toBe('refreshed_token');
  });

  it('clears state and rethrows error when refresh fails', (done) => {
    service.setAccessToken('some_token');

    service.refresh().subscribe({
      error: () => {
        expect(service.isAuthenticated()).toBe(false);
        done();
      },
    });

    http.expectOne(`${environment.apiUrl}/auth/refresh`).flush(
      { message: 'Unauthorized' },
      { status: 401, statusText: 'Unauthorized' }
    );
  });
});
