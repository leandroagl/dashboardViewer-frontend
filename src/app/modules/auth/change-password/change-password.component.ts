import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPwd    = control.get('newPassword')?.value;
  const confirmPwd = control.get('confirmPassword')?.value;
  return newPwd && confirmPwd && newPwd !== confirmPwd ? { passwordMismatch: true } : null;
}

@Component({
  selector:    'app-change-password',
  standalone:  false,
  templateUrl: './change-password.component.html',
  styleUrls:   ['./change-password.component.scss'],
})
export class ChangePasswordComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error   = signal('');

  protected readonly form = this.fb.group({
    oldPassword:     ['', Validators.required],
    newPassword:     ['', [Validators.required, Validators.minLength(8),
                           Validators.pattern(/(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordMatchValidator });

  protected submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.error.set('');
    this.loading.set(true);

    const { oldPassword, newPassword } = this.form.getRawValue();

    this.auth.changePassword(oldPassword!, newPassword!).subscribe({
      next: res => {
        this.loading.set(false);
        if (!res.ok) { this.error.set((res as any).error ?? 'Error al cambiar contraseña.'); return; }
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.error ?? 'Error al cambiar contraseña.');
      },
    });
  }
}
