import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
import { FileDemoComponent } from './components/file-demo/file-demo.component';

const routes: Routes = [
  { path: 'admin', component: AdminDashboardComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'files', component: FileDemoComponent },
  { path: '', redirectTo: '/files', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { } 