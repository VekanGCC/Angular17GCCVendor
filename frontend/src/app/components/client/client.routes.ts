import { Routes } from '@angular/router';
import { ClientDashboardComponent } from '../client-dashboard/client-dashboard.component';

console.log('🔧 ClientRoutes: Loading client routes configuration');

export const CLIENT_ROUTES: Routes = [
  {
    path: '',
    component: ClientDashboardComponent
  },
  {
    path: 'finance/sow-management',
    component: ClientDashboardComponent
  },
  {
    path: 'finance/po-management',
    component: ClientDashboardComponent
  },
  {
    path: 'finance/invoice-management',
    component: ClientDashboardComponent
  },
  {
    path: 'finance/payment-management',
    component: ClientDashboardComponent
  }
];

console.log('🔧 ClientRoutes: Client routes configuration loaded:', CLIENT_ROUTES); 