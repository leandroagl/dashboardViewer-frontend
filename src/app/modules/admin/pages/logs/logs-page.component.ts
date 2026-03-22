import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { LogsService, LogFilters } from '@core/services/logs.service';
import { AuditLog, LogsMeta } from '@core/models';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { SNACKBAR_SHORT, SNACKBAR_LONG } from '@core/constants/app.constants';

@Component({
  selector:        'app-logs-page',
  standalone:      false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:     './logs-page.component.html',
  styleUrls:       ['./logs-page.component.scss'],
})
export class LogsPageComponent implements OnInit {
  private readonly service  = inject(LogsService);
  private readonly fb       = inject(FormBuilder);
  private readonly router   = inject(Router);
  private readonly route    = inject(ActivatedRoute);
  private readonly snackbar = inject(MatSnackBar);
  private readonly dialog   = inject(MatDialog);

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
    const p = this.route.snapshot.queryParams;
    this.filters.patchValue({
      accion:    p['accion']    || '',
      resultado: p['resultado'] || '',
      desde:     p['desde']     ? new Date(p['desde'])     : null,
      hasta:     p['hasta']     ? new Date(p['hasta'])     : null,
    });
    const initialPage = p['page'] ? +p['page'] : 1;
    this.loadLogs(initialPage);
    this.loadSuspiciousIps();
  }

  protected loadLogs(page = 1): void {
    this.loading.set(true);
    this.currentPage = page;

    const vals = this.filters.getRawValue();
    const desde = vals.desde ? (vals.desde as Date).toISOString() : undefined;
    const hasta  = vals.hasta  ? (vals.hasta  as Date).toISOString()  : undefined;

    this.router.navigate([], {
      relativeTo:  this.route,
      replaceUrl:  true,
      queryParams: {
        accion:    vals.accion    || null,
        resultado: vals.resultado || null,
        desde:     desde          || null,
        hasta:     hasta          || null,
        page:      page > 1 ? page : null,
      },
    });

    const filters: LogFilters = {
      accion:    vals.accion    || undefined,
      resultado: vals.resultado || undefined,
      desde,
      hasta,
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
      desde:     vals.desde ? (vals.desde as Date).toISOString() : undefined,
      hasta:     vals.hasta ? (vals.hasta  as Date).toISOString() : undefined,
    });
    window.open(url, '_blank');
  }

  protected clearLogs(): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title:        'Depurar registros',
        message:      '¿Confirmar depuración de todos los registros? Esta acción no se puede deshacer.',
        confirmLabel: 'Depurar',
        isDanger:     true,
      },
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.service.purgeLogs(new Date().toISOString()).subscribe({
        next: ({ deleted }) => {
          this.logs.set([]);
          this.meta.set(null);
          this.currentPage = 1;
          this.snackbar.open(`${deleted} registros eliminados`, 'OK', { duration: SNACKBAR_LONG });
        },
        error: () => this.snackbar.open('Error al depurar registros', 'OK', { duration: SNACKBAR_SHORT }),
      });
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
