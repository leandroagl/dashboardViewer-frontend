import { ChangeDetectionStrategy, Component, Input } from "@angular/core";

@Component({
  selector: "app-page-header",
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <mat-icon *ngIf="icon" class="page-header__icon">{{ icon }}</mat-icon>
      <div class="page-header__title-group">
        <h1 class="page-header__title">{{ title }}</h1>
        <p *ngIf="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
      </div>
      <div class="page-header__action">
        <ng-content></ng-content>
      </div>
    </header>
  `,
  styles: [
    `
      .page-header {
        display:     flex;
        align-items: center;
        gap:         12px;
      }
      .page-header__icon {
        font-size:   28px;
        width:       28px;
        height:      28px;
        color:       var(--color-primary);
        flex-shrink: 0;
      }
      .page-header__title-group {
        /* sin flex: 1 — el botón queda pegado al título */
      }
      .page-header__title {
        font-size:  20px;
        font-weight: 500;
        color:      var(--text-primary);
      }
      .page-header__subtitle {
        font-size:  12px;
        color:      var(--text-muted);
        margin-top: 2px;
      }
      .page-header__action {
        display:     flex;
        align-items: center;
        gap:         8px;
        flex-shrink: 0;
      }
    `,
  ],
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
  @Input() icon?: string;
}
