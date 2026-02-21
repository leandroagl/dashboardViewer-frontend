import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { UsersService } from '@core/services/users.service';
import { User } from '@core/models';
import { UserDialogComponent } from './user-dialog.component';

@Component({
  selector:    'app-users-page',
  standalone:  false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users-page.component.html',
  styleUrls:   ['./users-page.component.scss'],
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
      this.snackbar.open(
        `Usuario creado. Contraseña: ${result.plainPassword} — copiala ahora`,
        'OK', { duration: 15000, panelClass: 'snack-password' }
      );
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
      this.snackbar.open('Usuario actualizado', 'OK', { duration: 3000 });
    });
  }

  protected toggleStatus(user: User): void {
    this.service.setStatus(user.id, !user.activo).subscribe({
      next: () => {
        this.users.update(list => list.map(u => u.id === user.id ? { ...u, activo: !u.activo } : u));
        this.snackbar.open('Usuario actualizado', 'OK', { duration: 3000 });
      },
    });
  }

  protected resetPassword(user: User): void {
    this.service.resetPassword(user.id).subscribe({
      next: res => {
        this.snackbar.open(
          `Nueva contraseña: ${res.plainPassword} — copiala ahora`,
          'OK', { duration: 15000 }
        );
      },
    });
  }

  protected deleteUser(user: User): void {
    const ok = confirm(`¿Eliminar el usuario "${user.nombre}"? Esta acción no se puede deshacer.`);
    if (!ok) return;
    this.service.delete(user.id).subscribe({
      next: () => {
        this.users.update(list => list.filter(u => u.id !== user.id));
        this.snackbar.open('Usuario eliminado', 'OK', { duration: 3000 });
      },
      error: () => this.snackbar.open('Error al eliminar el usuario', 'OK', { duration: 3000 }),
    });
  }

  protected revokeKiosk(user: User): void {
    this.service.revokeKiosk(user.id).subscribe({
      next: () => this.snackbar.open('Sesión kiosk revocada', 'OK', { duration: 3000 }),
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