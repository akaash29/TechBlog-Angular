import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

const SESSION_KEY = 'lw_session_id';
const HEARTBEAT_INTERVAL_MS = 20_000;

/** Records page views and how long each one stays open, for the admin
 *  Insights dashboard. Best-effort throughout — a failed tracking call
 *  never surfaces to the visitor and never blocks navigation. */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly analyticsBase = `${environment.apiBaseUrl}/analytics`;

  private currentPageViewId: number | null = null;
  private pageEnteredAt = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // More reliable than 'beforeunload' for catching tab close/navigation
      // away, especially on mobile — fires whenever the page is about to be
      // hidden for any reason.
      window.addEventListener('pagehide', () => this.flushHeartbeat());
    }
  }

  /** Call on every route change — closes out the previous page's dwell
   *  time and starts tracking the new one. */
  trackPageView(path: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.flushHeartbeat();

    this.http
      .post<{ id: number }>(`${this.analyticsBase}/track`, {
        SessionId: this.getSessionId(),
        Path: path,
      })
      .subscribe({
        next: (res) => {
          this.currentPageViewId = res.id;
          this.pageEnteredAt = Date.now();
          this.startHeartbeatTimer();
        },
        error: () => {
          this.currentPageViewId = null;
        },
      });
  }

  /** Sends a final duration update via sendBeacon, which (unlike a normal
   *  HTTP request) is allowed to complete after the page starts unloading. */
  private flushHeartbeat(): void {
    this.sendHeartbeat(true);
    this.stopHeartbeatTimer();
    this.currentPageViewId = null;
  }

  private startHeartbeatTimer(): void {
    this.stopHeartbeatTimer();
    this.heartbeatTimer = setInterval(() => this.sendHeartbeat(false), HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeatTimer(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private sendHeartbeat(useBeacon: boolean): void {
    if (this.currentPageViewId === null) return;

    const elapsedSeconds = Math.round((Date.now() - this.pageEnteredAt) / 1000);
    const body = JSON.stringify({ PageViewId: this.currentPageViewId, ElapsedSeconds: elapsedSeconds });

    if (useBeacon && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(`${this.analyticsBase}/heartbeat`, new Blob([body], { type: 'application/json' }));
      return;
    }

    this.http
      .post(`${this.analyticsBase}/heartbeat`, body, { headers: { 'Content-Type': 'application/json' } })
      .subscribe({ error: () => undefined });
  }

  private getSessionId(): string {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }
}
