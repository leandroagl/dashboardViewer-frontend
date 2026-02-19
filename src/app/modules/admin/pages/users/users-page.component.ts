import { Component, inject, signal, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { UsersService } from '@core/services/users.service';
import { User } from '@core/models';
import { UserDialogComponent } from './user-dialog.component';

@Component({
  selector:    'app-users-page',
  standalone:  false,
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
      // Mostrar contraseña generada — es la única oportunidad de verla
      this.snackbar.open(
        `Usuario creado. Contraseña: ${result.plainPassword} — copiala ahora`,
        'OK',
        { duration: 15000, panelClass: 'snack-password' }
      );
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
          'OK',
          { duration: 15000 }
        );
      },
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
