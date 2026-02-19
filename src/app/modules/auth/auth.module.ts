import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

import { noAuthGuard, authGuard } from '@core/guards/auth.guard';
import { LoginComponent }          from './login/login.component';
import { ChangePasswordComponent } from './change-password/change-password.component';

const routes: Routes = [
  { path: 'login',           component: LoginComponent,          canActivate: [noAuthGuard] },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [authGuard] },
];

const MATERIAL = [
  MatFormFieldModule, MatInputModule, MatButtonModule,
  MatIconModule, MatProgressSpinnerModule,
];

@NgModule({
  declarations: [LoginComponent, ChangePasswordComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes), ...MATERIAL],
})
export class AuthModule {}
