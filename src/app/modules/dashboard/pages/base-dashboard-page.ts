// ─── BaseDashboardPage ────────────────────────────────────────────────────────
// Clase base abstracta para las páginas de dashboard.
// Centraliza: slug desde la ruta padre, signals de estado, refresh automático.

import { Directive, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, Observable } from 'rxjs';
import { REFRESH_INTERVAL_MS } from '@core/constants/app.constants';

@Directive()
export abstract class BaseDashboardPage<T> implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);

  protected readonly slug = toSignal(
    this.route.parent!.paramMap.pipe(map(p => p.get('slug') ?? '')),
    { initialValue: '' }
  );

  protected readonly loading     = signal(true);
  protected readonly data        = signal<T | null>(null);
  protected readonly error       = signal('');
  protected readonly lastUpdated = signal<Date | null>(null);

  private refreshInterval?: ReturnType<typeof setInterval>;

  private readonly onVisibilityChange = (): void => {
    if (document.hidden) {
      clearInterval(this.refreshInterval);
    } else {
      this.loadData();
      this.refreshInterval = setInterval(() => this.loadData(), REFRESH_INTERVAL_MS);
    }
  };

  protected abstract fetchData(slug: string): Observable<T>;

  ngOnInit(): void {
    this.loadData();
    this.refreshInterval = setInterval(() => this.loadData(), REFRESH_INTERVAL_MS);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshInterval);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  protected retry(): void {
    this.error.set('');
    this.loading.set(true);
    this.loadData();
  }

  private loadData(): void {
    const slug = this.slug();
    if (!slug) return;
    this.fetchData(slug).subscribe({
      next:  d  => { this.data.set(d); this.loading.set(false); this.error.set(''); this.lastUpdated.set(new Date()); },
      error: () => { this.error.set('No se pudo cargar el dashboard.'); this.loading.set(false); },
    });
  }
}
