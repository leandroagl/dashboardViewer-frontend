// ─── BaseDashboardPage ────────────────────────────────────────────────────────
// Clase base abstracta para las páginas de dashboard.
// Centraliza: slug desde la ruta padre, signals de estado, refresh automático.

import { Directive, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, Observable } from 'rxjs';

const REFRESH_INTERVAL_MS = 60_000;

@Directive()
export abstract class BaseDashboardPage<T> implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);

  protected readonly slug = toSignal(
    this.route.parent!.paramMap.pipe(map(p => p.get('slug') ?? '')),
    { initialValue: '' }
  );

  protected readonly loading = signal(true);
  protected readonly data    = signal<T | null>(null);
  protected readonly error   = signal('');

  private refreshInterval?: ReturnType<typeof setInterval>;

  protected abstract fetchData(slug: string): Observable<T>;

  ngOnInit(): void {
    this.loadData();
    this.refreshInterval = setInterval(() => this.loadData(), REFRESH_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshInterval);
  }

  private loadData(): void {
    const slug = this.slug();
    if (!slug) return;
    this.fetchData(slug).subscribe({
      next:  d  => { this.data.set(d); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar el dashboard.'); this.loading.set(false); },
    });
  }
}
