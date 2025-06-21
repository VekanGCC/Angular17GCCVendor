import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const VendorGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('Vendor Guard: Checking vendor access');
  
  return authService.user$.pipe(
    take(1),
    map(user => {
      console.log('Vendor Guard: Current user:', user);
      const isAuthenticated = authService.isAuthenticated();
      const isVendor = user?.userType === 'vendor';
      console.log('Vendor Guard: Is authenticated:', isAuthenticated, 'Is vendor:', isVendor);
      
      if (user && isAuthenticated && isVendor) {
        return true;
      }
      
      console.log('Vendor Guard: Not authorized, redirecting to home');
      router.navigate(['/']);
      return false;
    })
  );
}; 