import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-layout.component.html',
  styleUrls:   ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent {
  private readonly auth = inject(AuthService);
  protected readonly clienteSlug = this.auth.clienteSlug;

  protected logout(): void { this.auth.logout(); }
}
