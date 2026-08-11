import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Attaches the access token to every request except the auth/register
 *  endpoints themselves, and transparently refreshes + retries once on
 *  a 401 before giving up. Must run "inside" the error interceptor (see
 *  the provider order in app.config.ts) so a failed refresh still ends
 *  up surfaced as a single toast, not two. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  if (isPublicAuthEndpoint(req.url)) {
    return next(req);
  }

  return next(withAccessToken(req, authService.getAccessToken())).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || !authService.getRefreshToken()) {
        return throwError(() => error);
      }

      return authService.refreshAccessToken().pipe(
        switchMap((session) => next(withAccessToken(req, session.accessToken))),
        catchError((refreshError) => {
          authService.clearSession();
          return throwError(() => refreshError);
        })
      );
    })
  );
};

function withAccessToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}

/** Endpoints that never need (and, being [AllowAnonymous], never expect)
 *  a bearer token: signing in, refreshing, revoking, and registering. */
function isPublicAuthEndpoint(url: string): boolean {
  return url.includes('/auth/') || url.endsWith('/users/register');
}
