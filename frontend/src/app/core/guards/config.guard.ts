import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { map, of } from 'rxjs';

export const configGuard: CanActivateFn = (route, state) => {
  const configService = inject(ConfigService);
  const router = inject(Router);

  // Check if already have config status
  const currentStatus = configService.getCurrentStatus();
  if (currentStatus) {
    if (currentStatus.isConfigured) {
      return true;
    } else {
      router.navigate(['/setup']);
      return false;
    }
  }

  // Load config status if not available
  return configService.loadConfigStatus().pipe(
    map(status => {
      if (status.isConfigured) {
        return true;
      } else {
        router.navigate(['/setup']);
        return false;
      }
    })
  );
};
