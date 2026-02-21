// ─── DashboardLayoutComponent ─────────────────────────────────────────────────
// Layout fullscreen con navegación automática entre dashboards.
// Los controles se desvanecen tras 4 segundos de inactividad.

import {
  ChangeDetectionStrategy, Component, inject, signal, computed, OnInit, OnDestroy, HostListener
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { DashboardService } from '@core/services/dashboard.service';
import { DashboardType } from '@core/models';
import { AUTO_ADVANCE_MS, CONTROLS_HIDE_MS } from '@core/constants/app.constants';

interface NavItem {
  type:  DashboardType;
  label: string;
  icon:  string;
  path:  string;
}

const NAV_CONFIG: Record<DashboardType, Omit<NavItem, 'type' | 'path'>> = {
  servers:    { label: 'Servidores', icon: 'dns'      },
  backups:    { label: 'Backups',    icon: 'backup'   },
  networking: { label: 'Networking', icon: 'router'   },
  windows:    { label: 'Windows',    icon: 'computer' },
};


@Component({
  selector:    'app-dashboard-layout',
  standalone:  false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-layout.component.html',
  styleUrls:   ['./dashboard-layout.component.scss'],
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  private readonly route            = inject(ActivatedRoute);
  private readonly router           = inject(Router);
  private readonly authService      = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);

  protected readonly slug      = toSignal(this.route.paramMap.pipe(map(p => p.get('slug') ?? '')), { initialValue: '' });
  protected readonly navItems  = signal<NavItem[]>([]);
  protected readonly loading   = signal(true);
  protected readonly paused    = signal(false);
  protected readonly isAdmin   = this.authService.isAdmin;

  // Índice del dashboard activo (sincronizado con la URL)
  protected readonly activeIndex = signal(0);

  // Controles visibles / ocultos por inactividad
  protected readonly controlsVisible = signal(true);

  protected readonly currentDash = computed(() => this.navItems()[this.activeIndex()] ?? null);
  protected readonly totalDashes = computed(() => this.navItems().length);

  private advanceInterval?: ReturnType<typeof setInterval>;
  private hideControlsTimer?: ReturnType<typeof setTimeout>;
  protected readonly isFullscreen = signal(false);

  ngOnInit(): void {
    this.loadDashboards();
    this.scheduleHideControls();

    // Sincronizar activeIndex con la URL actual
    this.route.firstChild?.url.subscribe(segments => {
      const current = segments[segments.length - 1]?.path as DashboardType;
      const idx = this.navItems().findIndex(n => n.type === current);
      if (idx >= 0) this.activeIndex.set(idx);
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.advanceInterval);
    clearTimeout(this.hideControlsTimer);
  }

  // ─── Carga de dashboards disponibles ─────────────────────────────────────────

  private loadDashboards(): void {
    const slug = this.slug();
    if (!slug) return;

    this.dashboardService.getAvailable(slug).subscribe({
      next: types => {
        const items = types.map(type => ({
          type,
          path:  `/${slug}/dashboards/${type}`,
          ...NAV_CONFIG[type],
        }));
        this.navItems.set(items);
        this.loading.set(false);
        this.syncIndexFromUrl();
        if (items.length > 1) this.startAutoAdvance();
      },
      error: () => this.loading.set(false),
    });
  }

  private syncIndexFromUrl(): void {
    const url  = this.router.url;
    const idx  = this.navItems().findIndex(n => url.includes(n.type));
    this.activeIndex.set(idx >= 0 ? idx : 0);
  }

  // ─── Avance automático ────────────────────────────────────────────────────────

  private startAutoAdvance(): void {
    clearInterval(this.advanceInterval);
    this.advanceInterval = setInterval(() => {
      if (!this.paused()) this.goNext();
    }, AUTO_ADVANCE_MS);
  }

  protected goNext(): void {
    const next = (this.activeIndex() + 1) % this.totalDashes();
    this.navigateTo(next);
  }

  protected goPrev(): void {
    const prev = (this.activeIndex() - 1 + this.totalDashes()) % this.totalDashes();
    this.navigateTo(prev);
  }

  protected navigateTo(index: number): void {
    this.activeIndex.set(index);
    const item = this.navItems()[index];
    if (item) this.router.navigate([item.path]);
  }

  protected togglePause(): void {
    this.paused.update(v => !v);
    this.showControls();
  }

  // ─── Pantalla completa ────────────────────────────────────────────────────────

  protected toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    this.showControls();
  }

  // Sincroniza el signal con el estado real del browser (cubre el caso Esc).
  @HostListener('document:fullscreenchange')
  protected onFullscreenChange(): void {
    this.isFullscreen.set(!!document.fullscreenElement);
  }

  protected get fullscreenIcon(): string {
    return this.isFullscreen() ? 'fullscreen_exit' : 'fullscreen';
  }

  // ─── Visibilidad de controles ─────────────────────────────────────────────────

  @HostListener('mousemove')
  @HostListener('touchstart')
  @HostListener('keydown')
  protected onActivity(): void {
    this.showControls();
  }

  private showControls(): void {
    this.controlsVisible.set(true);
    this.scheduleHideControls();
  }

  private scheduleHideControls(): void {
    clearTimeout(this.hideControlsTimer);
    this.hideControlsTimer = setTimeout(() => {
      this.controlsVisible.set(false);
    }, CONTROLS_HIDE_MS);
  }

  protected logout(): void { this.authService.logout(); }
}
