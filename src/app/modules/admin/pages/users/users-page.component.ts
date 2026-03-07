import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { UsersService } from '@core/services/users.service';
import { User } from '@core/models';
import { UserDialogComponent } from './user-dialog.component';
import { PasswordDisplayDialogComponent } from './password-display-dialog.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { SNACKBAR_SHORT, SNACKBAR_LONG } from '@core/constants/app.constants';

@Component({
  selector:        'app-users-page',
  standalone:      false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:     './users-page.component.html',
  styleUrls:       ['./users-page.component.scss'],
})
export class UsersPageComponent implements OnInit {
  private readonly service  = inject(UsersService);
  private readonly snackbar = inject(MatSnackBar);
  private readonly dialog   = inject(MatDialog);

  protected readonly users         = signal<User[]>([]);
  protected readonly loading       = signal(true);
  protected readonly displayedCols = ['nombre', 'rol', 'cliente', 'ultimo_acceso', 'activo', 'acciones'];

  ngOnInit(): void { this.loadUsers(); }

  private loadUsers(): void {
    this.service.getAll().subscribe({
      next:  u  => { this.users.set(u); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  protected openNewUserDialog(): void {
    const ref = this.dialog.open(UserDialogComponent, { width: '480px', disableClose: true });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.users.update(list => [...list, result]);
      this.dialog.open(PasswordDisplayDialogComponent, {
        data: { password: result.plainPassword, title: 'Usuario creado' },
        disableClose: true,
      });
    });
  }

  protected openEditUserDialog(user: User): void {
    const ref = this.dialog.open(UserDialogComponent, {
      width: '480px',
      disableClose: true,
      data: { user },
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.users.update(list => list.map(u => u.id === result.id ? { ...u, ...result } : u));
      this.snackbar.open('Usuario actualizado', 'OK', { duration: SNACKBAR_SHORT });
    });
  }

  protected toggleStatus(user: User): void {
    this.service.setStatus(user.id, !user.activo).subscribe({
      next: () => {
        this.users.update(list => list.map(u => u.id === user.id ? { ...u, activo: !u.activo } : u));
        this.snackbar.open('Usuario actualizado', 'OK', { duration: SNACKBAR_SHORT });
      },
    });
  }

  protected resetPassword(user: User): void {
    this.service.resetPassword(user.id).subscribe({
      next: res => {
        this.dialog.open(PasswordDisplayDialogComponent, {
          data: { password: res.plainPassword, title: 'Nueva contraseña' },
          disableClose: true,
        });
      },
    });
  }

  protected deleteUser(user: User): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title:        'Eliminar usuario',
        message:      `¿Eliminar el usuario "${user.nombre}"? Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        isDanger:     true,
      },
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.service.delete(user.id).subscribe({
        next: () => {
          this.users.update(list => list.filter(u => u.id !== user.id));
          this.snackbar.open('Usuario eliminado', 'OK', { duration: SNACKBAR_SHORT });
        },
        error: () => this.snackbar.open('Error al eliminar el usuario', 'OK', { duration: SNACKBAR_SHORT }),
      });
    });
  }

  protected revokeKiosk(user: User): void {
    this.service.revokeKiosk(user.id).subscribe({
      next: () => this.snackbar.open('Sesión kiosk revocada', 'OK', { duration: SNACKBAR_SHORT }),
    });
  }

  protected isLocked(user: User): boolean {
    return !!user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date();
  }

  protected unlockUser(user: User): void {
    this.service.unlock(user.id).subscribe({
      next: updated => {
        this.users.update(list => list.map(u => u.id === updated.id ? { ...u, ...updated } : u));
        this.snackbar.open(`Cuenta de ${user.nombre} desbloqueada.`, 'OK', { duration: SNACKBAR_SHORT });
      },
      error: () => {
        this.snackbar.open('Error al desbloquear la cuenta.', 'OK', { duration: SNACKBAR_LONG });
      },
    });
  }

  protected getRolLabel(rol: string): string {
    const labels: Record<string, string> = {
      admin_ondra:  'Admin',
      viewer:       'Viewer',
      viewer_kiosk: 'Kiosk',
    };
    return labels[rol] ?? rol;
  }
}
