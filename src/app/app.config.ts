import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { errorInterceptor } from './interceptors/error.interceptor';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    // errorInterceptor must run outermost (listed first) so it only
    // toasts once authInterceptor's refresh-and-retry has had its shot —
    // otherwise a transient 401 that gets silently retried would still
    // flash an error toast.
    provideHttpClient(withFetch(), withInterceptors([errorInterceptor, authInterceptor])),
  ]
};
