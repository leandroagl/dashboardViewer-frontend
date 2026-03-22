import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ClientsService } from '@core/services/clients.service';
import { Client } from '@core/models';
import { ClientDialogComponent } from './client-dialog.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { SNACKBAR_SHORT, SNACKBAR_LONG } from '@core/constants/app.constants';

@Component({
  selector:        'app-clients-page',
  standalone:      false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:     './clients-page.component.html',
  styleUrls:       ['./clients-page.component.scss'],
})
export class ClientsPageComponent implements OnInit {
  private readonly service  = inject(ClientsService);
  private readonly snackbar = inject(MatSnackBar);
  private readonly dialog   = inject(MatDialog);

  protected readonly clients       = signal<Client[]>([]);
  protected readonly loading       = signal(true);
  protected readonly displayedCols = ['nombre', 'slug', 'total_usuarios', 'ultimo_acceso', 'activo', 'acciones'];

  ngOnInit(): void { this.loadClients(); }

  private loadClients(): void {
    this.service.getAll().subscribe({
      next:  c  => { this.clients.set(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  protected openNewClientDialog(): void {
    const ref = this.dialog.open(ClientDialogComponent, { width: '480px', disableClose: true });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.clients.update(list => [...list, result]);
        this.snackbar.open(`Cliente "${result.nombre}" creado.`, 'OK', { duration: SNACKBAR_LONG });
      }
    });
  }

  protected openEditClientDialog(client: Client): void {
    const ref = this.dialog.open(ClientDialogComponent, {
      width: '480px',
      disableClose: true,
      data: { client },
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.clients.update(list => list.map(c => c.id === result.id ? { ...c, ...result } : c));
      this.snackbar.open('Cliente actualizado', 'OK', { duration: SNACKBAR_SHORT });
    });
  }

  protected toggleStatus(client: Client): void {
    this.service.setStatus(client.id, !client.activo).subscribe({
      next: updated => {
        this.clients.update(list => list.map(c => c.id === updated.id ? updated : c));
        this.snackbar.open(`Cliente ${updated.activo ? 'activado' : 'desactivado'}`, 'OK', { duration: SNACKBAR_SHORT });
      },
      error: () => this.snackbar.open('Error al actualizar el cliente', 'OK', { duration: SNACKBAR_SHORT }),
    });
  }

  protected deleteClient(client: Client): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title:        'Eliminar cliente',
        message:      `¿Eliminar el cliente "${client.nombre}"? Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        isDanger:     true,
      },
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.service.delete(client.id).subscribe({
        next: () => {
          this.clients.update(list => list.filter(c => c.id !== client.id));
          this.snackbar.open('Cliente eliminado', 'OK', { duration: SNACKBAR_SHORT });
        },
        error: (err: any) => {
          const msg = err?.error?.error || 'Error al eliminar el cliente';
          this.snackbar.open(msg, 'OK', { duration: SNACKBAR_LONG });
        },
      });
    });
  }
}
