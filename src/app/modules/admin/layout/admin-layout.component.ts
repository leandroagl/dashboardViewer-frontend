import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { ClientsService } from '@core/services/clients.service';
import { Client } from '@core/models';

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-layout.component.html',
  styleUrls:   ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent implements OnInit {
  private readonly auth    = inject(AuthService);
  private readonly clients = inject(ClientsService);

  protected readonly clienteSlug   = this.auth.clienteSlug;
  protected readonly activeClients = signal<Client[]>([]);

  ngOnInit(): void {
    this.clients.getAll().subscribe(list =>
      this.activeClients.set(list.filter(c => c.activo))
    );
  }

  protected logout(): void { this.auth.logout(); }
}
