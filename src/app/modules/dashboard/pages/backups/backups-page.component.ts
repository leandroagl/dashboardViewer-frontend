import { Component, inject, signal, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { map } from "rxjs";
import { DashboardService } from "@core/services/dashboard.service";
import { BackupsDashboard, SensorStatus } from "@core/models";

@Component({
  selector: "app-backups-page",
  standalone: false,
  templateUrl: "./backups-page.component.html",
  styleUrls: ["./backups-page.component.scss"],
})
export class BackupsPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(DashboardService);

  private readonly slug = toSignal(
    this.route.parent!.paramMap.pipe(map((p) => p.get("slug") ?? "")),
    { initialValue: "" },
  );

  protected readonly loading = signal(true);
  protected readonly data = signal<BackupsDashboard | null>(null);
  protected readonly error = signal("");

  private refreshInterval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.load();
    this.refreshInterval = setInterval(() => this.load(), 60_000);
  }
  ngOnDestroy(): void {
    clearInterval(this.refreshInterval);
  }

  private load(): void {
    this.service.getBackups(this.slug()).subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => {
        this.error.set("No se pudo cargar el dashboard.");
        this.loading.set(false);
      },
    });
  }

  // ─── Helpers para el template ────────────────────────────────────────────────

  protected rateStatus(rate: number): SensorStatus {
    if (rate >= 90) return "ok";
    if (rate >= 70) return "warning";
    return "error";
  }

  protected jobsErrorCount(d: BackupsDashboard): number {
    return d.devices
      .flatMap((dev) => dev.jobs)
      .filter((j) => j.lastStatus === "error").length;
  }

  protected jobsErrorStatus(d: BackupsDashboard): SensorStatus {
    const count = this.jobsErrorCount(d);
    return count === 0 ? "ok" : count <= 2 ? "warning" : "error";
  }
}
