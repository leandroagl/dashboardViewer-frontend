import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SharedModule } from '@shared/shared.module';
import { authGuard, adminGuard, passwordChangeGuard } from '@core/guards/auth.guard';

import { AdminLayoutComponent }  from './layout/admin-layout.component';
import { ClientsPageComponent }  from './pages/clients/clients-page.component';
import { UsersPageComponent }    from './pages/users/users-page.component';
import { LogsPageComponent }     from './pages/logs/logs-page.component';
// Standalone — van en imports, no en declarations
import { ClientDialogComponent } from './pages/clients/client-dialog.component';
import { UserDialogComponent }   from './pages/users/user-dialog.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminGuard, passwordChangeGuard],
    children: [
      { path: '',         redirectTo: 'clients', pathMatch: 'full' },
      { path: 'clients',  component: ClientsPageComponent },
      { path: 'users',    component: UsersPageComponent },
      { path: 'logs',     component: LogsPageComponent },
    ],
  },
];

const MATERIAL = [
  MatSidenavModule, MatListModule, MatTableModule, MatPaginatorModule,
  MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
  MatSlideToggleModule, MatMenuModule, MatChipsModule, MatDividerModule,
  MatSnackBarModule, MatProgressSpinnerModule, MatDatepickerModule, MatNativeDateModule,
  MatButtonModule, MatIconModule, MatTooltipModule,
];

@NgModule({
  declarations: [
    AdminLayoutComponent,
    ClientsPageComponent,
    UsersPageComponent,
    LogsPageComponent,
    // ClientDialogComponent y UserDialogComponent son standalone → no van aquí
  ],
  imports: [
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    ...MATERIAL,
    // Standalone components se importan aquí
    ClientDialogComponent,
    UserDialogComponent,
  ],
})
export class AdminModule {}
