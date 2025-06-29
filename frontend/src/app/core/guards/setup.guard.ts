import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { map } from 'rxjs';

export const setupGuard: CanActivateFn = () => {
  const configService = inject(ConfigService);
  const router = inject(Router);

  // Check if already have config status
  const currentStatus = configService.getCurrentStatus();
  if (currentStatus) {
    if (currentStatus.isConfigured) {
      // Already configured, redirect to dashboard
      router.navigate(['/dashboard']);
      return false;
    } else {
      // Not configured, allow access to setup
      return true;
    }
  }

  // Load config status if not available
  return configService.loadConfigStatus().pipe(
    map(status => {
      if (status.isConfigured) {
        // Already configured, redirect to dashboard
        router.navigate(['/dashboard']);
        return false;
      } else {
        // Not configured, allow access to setup
        return true;
      }
    })
  );
};