import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LogsService, LogFilters } from '@core/services/logs.service';
import { AuditLog, LogsMeta } from '@core/models';

@Component({
  selector:    'app-logs-page',
  standalone:  false,
  templateUrl: './logs-page.component.html',
  styleUrls:   ['./logs-page.component.scss'],
})
export class LogsPageComponent implements OnInit {
  private readonly service  = inject(LogsService);
  private readonly fb       = inject(FormBuilder);
  private readonly snackbar = inject(MatSnackBar);

  protected readonly logs          = signal<AuditLog[]>([]);
  protected readonly meta          = signal<LogsMeta | null>(null);
  protected readonly loading       = signal(true);
  protected readonly suspiciousIps = signal<{ ip_origen: string; intentos: number; ultimo: string }[]>([]);
  protected readonly displayedCols = ['timestamp', 'accion', 'usuario', 'cliente', 'ip_origen', 'resultado'];

  protected readonly filters = this.fb.group({
    accion:    [''],
    resultado: [''],
    desde:     [null as Date | null],
    hasta:     [null as Date | null],
  });

  protected currentPage = 1;

  ngOnInit(): void {
    this.loadLogs();
    this.loadSuspiciousIps();
  }

  protected loadLogs(page = 1): void {
    this.loading.set(true);
    this.currentPage = page;

    const vals = this.filters.getRawValue();
    const filters: LogFilters = {
      accion:    vals.accion    || undefined,
      resultado: vals.resultado || undefined,
      desde:     vals.desde  ? (vals.desde as Date).toISOString()  : undefined,
      hasta:     vals.hasta  ? (vals.hasta  as Date).toISOString()  : undefined,
      page,
    };

    this.service.getLogs(filters).subscribe({
      next: ({ logs, meta }) => {
        this.logs.set(logs);
        this.meta.set(meta);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadSuspiciousIps(): void {
    this.service.getSuspiciousIps().subscribe({
      next: ips => this.suspiciousIps.set(ips),
    });
  }

  protected clearFilters(): void {
    this.filters.reset();
    this.loadLogs(1);
  }

  protected exportCsv(): void {
    const vals = this.filters.getRawValue();
    const url  = this.service.getExportUrl({
      accion:    vals.accion    || undefined,
      resultado: vals.resultado || undefined,
    });
    window.open(url, '_blank');
  }

  protected clearLogs(): void {
  const ok = confirm('¿Confirmar depuración de todos los registros? Esta acción no se puede deshacer.');
  if (!ok) return;
  this.service.purgeLogs().subscribe({
    next: ({ deleted }) => {
      this.logs.set([]);
      this.meta.set(null);
      this.snackbar.open(`${deleted} registros eliminados`, 'OK', { duration: 4000 });
    },
    error: () => this.snackbar.open('Error al depurar registros', 'OK', { duration: 3000 }),
  });
}

  protected isSuspiciousIp(ip: string): boolean {
    return this.suspiciousIps().some(s => s.ip_origen === ip);
  }

  protected resultadoStatus(r: string): 'ok' | 'error' | 'warning' {
    if (r === 'ok')           return 'ok';
    if (r === 'unauthorized') return 'warning';
    return 'error';
  }
}