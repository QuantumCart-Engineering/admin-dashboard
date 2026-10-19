import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../services/auth-store';

/** Keeps signed-in administrators away from the login screen. */
export const guestGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);

  if (store.isAdmin()) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
