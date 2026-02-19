import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { SharedModule } from '@shared/shared.module';
import { authGuard, passwordChangeGuard } from '@core/guards/auth.guard';

import { DashboardLayoutComponent }  from './layout/dashboard-layout.component';
import { SelectClientComponent }     from './pages/select-client/select-client.component';
import { ServersPageComponent }      from './pages/servers/servers-page.component';
import { BackupsPageComponent }      from './pages/backups/backups-page.component';
import { NetworkingPageComponent }   from './pages/networking/networking-page.component';
import { WindowsPageComponent }      from './pages/windows/windows-page.component';

const routes: Routes = [
  {
    path: 'select-client',
    component: SelectClientComponent,
    canActivate: [authGuard, passwordChangeGuard],
  },
  {
    path: ':slug',
    component: DashboardLayoutComponent,
    canActivate: [authGuard, passwordChangeGuard],
    children: [
      { path: 'dashboards',            redirectTo: 'dashboards/servers', pathMatch: 'full' },
      { path: 'dashboards/servers',    component: ServersPageComponent },
      { path: 'dashboards/backups',    component: BackupsPageComponent },
      { path: 'dashboards/networking', component: NetworkingPageComponent },
      { path: 'dashboards/windows',    component: WindowsPageComponent },
    ],
  },
];

@NgModule({
  declarations: [
    DashboardLayoutComponent,
    SelectClientComponent,
    ServersPageComponent,
    BackupsPageComponent,
    NetworkingPageComponent,
    WindowsPageComponent,
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    MatSidenavModule, MatListModule, MatMenuModule,
    MatDividerModule, MatProgressSpinnerModule, MatChipsModule,
  ],
})
export class DashboardModule {}
