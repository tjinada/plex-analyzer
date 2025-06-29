import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { map } from 'rxjs';

export const redirectGuard: CanActivateFn = () => {
  const configService = inject(ConfigService);
  const router = inject(Router);

  // Check if already have config status
  const currentStatus = configService.getCurrentStatus();
  if (currentStatus) {
    if (currentStatus.isConfigured) {
      router.navigate(['/dashboard']);
    } else {
      router.navigate(['/setup']);
    }
    return false; // Always redirect, never stay on root
  }

  // Load config status if not available
  return configService.loadConfigStatus().pipe(
    map(status => {
      if (status.isConfigured) {
        router.navigate(['/dashboard']);
      } else {
        router.navigate(['/setup']);
      }
      return false; // Always redirect, never stay on root
    })
  );
};