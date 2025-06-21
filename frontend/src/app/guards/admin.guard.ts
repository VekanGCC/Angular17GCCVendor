import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const AdminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('Admin Guard: Checking admin access');
  
  
  return authService.user$.pipe(
    take(1),
    map(user => {
      console.log('Admin Guard: Current user:', user);
      const isAuthenticated = authService.isAuthenticated();
      const isAdmin = user?.userType === 'admin';
      console.log('Admin Guard: Is authenticated:', isAuthenticated, 'Is admin:', isAdmin);
      
      if (user && isAuthenticated && isAdmin) {
        console.log('Admin Guard: Access granted');
        return true;
      }
      
      console.log('Admin Guard: Access denied, redirecting to home');
      router.navigate(['/']);
      return false;
    })
  );
};