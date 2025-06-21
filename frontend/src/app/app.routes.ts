import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { VendorGuard } from './guards/vendor.guard';
import { ClientGuard } from './guards/client.guard';
import { LandingComponent } from './components/landing/landing.component';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { VendorDashboardComponent } from './components/vendor-dashboard/vendor-dashboard.component';
import { ClientDashboardComponent } from './components/client-dashboard/client-dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'signup',
    component: SignupComponent
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'vendor',
    component: VendorDashboardComponent,
    canActivate: [AuthGuard, VendorGuard]
  },
  {
    path: 'client',
    component: ClientDashboardComponent,
    canActivate: [AuthGuard, ClientGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];