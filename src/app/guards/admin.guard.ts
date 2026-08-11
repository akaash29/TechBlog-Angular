import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Only lets Admin-role users through — everyone else signed in bounces to
 *  the feed; everyone signed out goes to sign-in with a returnUrl, same as
 *  authGuard. */
export const adminGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.currentUser()?.role === 'Admin') {
    return true;
  }

  return authService.isAuthenticated()
    ? router.parseUrl('/feed')
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
