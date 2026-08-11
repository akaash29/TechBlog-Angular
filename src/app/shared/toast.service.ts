import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastState {
  message: string;
  variant: ToastVariant;
  duration: number;
  /** Bumped on every show() so the host recreates its element (and so
   *  restarts the progress-bar animation) even for a repeat message. */
  key: number;
}

/** A small, self-contained toast/snackbar service with a countdown
 *  progress bar — see ToastHost for the visual. Mount <app-toast-host />
 *  once (in app.html) and call show() from anywhere via DI. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toast = signal<ToastState | null>(null);
  readonly toast = this._toast.asReadonly();

  private nextKey = 0;
  private hideTimer?: ReturnType<typeof setTimeout>;

  /** Shows the toast and resolves once its countdown finishes — handy
   *  for delaying a redirect until the message has actually been seen. */
  show(message: string, variant: ToastVariant = 'info', duration = 3000): Promise<void> {
    clearTimeout(this.hideTimer);
    this._toast.set({ message, variant, duration, key: ++this.nextKey });

    return new Promise((resolve) => {
      this.hideTimer = setTimeout(() => {
        this._toast.set(null);
        resolve();
      }, duration);
    });
  }

  dismiss(): void {
    clearTimeout(this.hideTimer);
    this._toast.set(null);
  }
}
