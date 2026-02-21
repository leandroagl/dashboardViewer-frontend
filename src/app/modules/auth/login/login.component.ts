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

  protected readonly form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.error.set('');
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
      error: () => {
        this.loading.set(false);
        this.error.set('Email o contraseña incorrectos.');
      },
    });
  }
}