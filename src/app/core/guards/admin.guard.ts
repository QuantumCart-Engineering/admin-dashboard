import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../services/auth-store';

/**
 * Requires an authenticated session whose role is ADMIN. A logged-in customer
 * (or a stale non-admin session) is dropped and sent back to the login screen;
 * the backend independently rejects non-admin API calls.
 */
export const adminGuard: CanActivateFn = (_route, state) => {
  const store = inject(AuthStore);
  const router = inject(Router);

  if (store.isAdmin()) {
    return true;
  }

  store.clearSession();

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
