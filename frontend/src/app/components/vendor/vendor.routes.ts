import { Routes } from '@angular/router';

export const VENDOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../vendor-dashboard/vendor-dashboard.component').then(m => m.VendorDashboardComponent)
  }
]; 