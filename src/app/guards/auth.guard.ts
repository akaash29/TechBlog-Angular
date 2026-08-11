import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Bounces signed-out visitors to the sign-in page instead of letting them
 *  land on /compose, /profile, etc. directly by URL — carries the page they
 *  were headed to as ?returnUrl so Login/Register can send them back there
 *  once they're signed in, instead of always dropping them on /feed. */
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
