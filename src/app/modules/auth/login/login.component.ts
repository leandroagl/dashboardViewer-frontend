import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector:    'app-login',
  standalone:  false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrls:   ['./login.component.scss'],
})
export class LoginComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading        = signal(false);
  protected readonly error          = signal('');
  protected readonly showPwd        = signal(false);
  protected readonly showForgotMsg  = signal(false);
  protected readonly lockoutUntil   = signal<Date | null>(null);
  protected readonly attemptsLeft   = signal<number | null>(null);

  protected readonly form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid || this.loading() || !!this.lockoutUntil()) return;
    this.error.set('');
    this.attemptsLeft.set(null);
    this.loading.set(true);

    const { email, password } = this.form.getRawValue();

    this.auth.login(email!, password!).subscribe({
      next: res => {
        this.loading.set(false);
        if (!res.ok) { this.error.set('Email o contraseña incorrectos.'); return; }
        if (res.data?.mustChangePassword) { this.router.navigate(['/change-password']); return; }
        if (res.data?.rol === 'admin_ondra') { this.router.navigate(['/admin/clients']); return; }
        const slug = res.data?.clienteSlug;
        if (slug) this.router.navigate([`/${slug}/dashboards`]);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 423) {
          this.lockoutUntil.set(new Date(err.error?.bloqueado_hasta));
          this.error.set('');
          this.attemptsLeft.set(null);
        } else {
          this.lockoutUntil.set(null);
          const restantes = err?.error?.intentos_restantes ?? null;
          this.attemptsLeft.set(typeof restantes === 'number' ? restantes : null);
          this.error.set('Email o contraseña incorrectos.');
        }
      },
    });
  }
}