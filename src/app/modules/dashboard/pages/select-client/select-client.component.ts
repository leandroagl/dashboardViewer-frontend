// SelectClientComponent — Admin elige qué cliente visualizar
import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClientsService } from '@core/services/clients.service';
import { Client } from '@core/models';

@Component({
  selector: 'app-select-client', standalone: false,
  templateUrl: './select-client.component.html',
  styleUrls: ['./select-client.component.scss'],
})
export class SelectClientComponent implements OnInit {
  private readonly router  = inject(Router);
  private readonly service = inject(ClientsService);

  protected readonly clients = signal<Client[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.service.getAll().subscribe({
      next:  c  => { this.clients.set(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  protected select(client: Client): void {
    this.router.navigate([`/${client.slug}/dashboards/servers`]);
  }
}
