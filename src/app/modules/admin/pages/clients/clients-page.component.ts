import { Component, inject, signal, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ClientsService } from '@core/services/clients.service';
import { Client } from '@core/models';
import { ClientDialogComponent } from './client-dialog.component';

@Component({
  selector:    'app-clients-page',
  standalone:  false,
  templateUrl: './clients-page.component.html',
  styleUrls:   ['./clients-page.component.scss'],
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
        this.snackbar.open(`Cliente "${result.nombre}" creado.`, 'OK', { duration: 4000 });
      }
    });
  }

  protected toggleStatus(client: Client): void {
    this.service.setStatus(client.id, !client.activo).subscribe({
      next: updated => {
        this.clients.update(list => list.map(c => c.id === updated.id ? updated : c));
        this.snackbar.open(`Cliente ${updated.activo ? 'activado' : 'desactivado'}`, 'OK', { duration: 3000 });
      },
    });
  }
}
