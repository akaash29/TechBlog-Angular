import { Component, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ToastHost } from './shared/toast-host/toast-host';
import { ImageUploadDialog } from './shared/image-upload-dialog/image-upload-dialog';
import { AnalyticsService } from './services/analytics.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastHost, ImageUploadDialog],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(router: Router, analytics: AnalyticsService) {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

    router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        analytics.trackPageView(event.urlAfterRedirects);

        // let Angular finish painting the new route's DOM first
        setTimeout(() => {
          const bootFns = [
            window.LW?.boot,
            window.LW?.bootAuth,
            window.LW?.bootFeed,
            window.LW?.bootJournal,
            window.LW?.bootCompose,
            window.LW?.bootProfile,
            window.LW?.bootWriters,
          ];

          // Run every boot function even if one throws — otherwise a bug in
          // an earlier page's script (e.g. one missing its "not on this
          // page" guard) silently stops every later one from running too.
          for (const fn of bootFns) {
            try {
              fn?.();
            } catch (err) {
              console.error('LW boot function failed:', err);
            }
          }
        });
      });
  }
}
