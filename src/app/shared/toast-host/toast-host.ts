import { Component, computed, inject } from '@angular/core';
import { ToastService } from '../toast.service';

@Component({
  selector: 'app-toast-host',
  imports: [],
  templateUrl: './toast-host.html',
  styleUrl: './toast-host.css',
})
export class ToastHost {
  private readonly toastService = inject(ToastService);

  // Wrapped as a single-item list keyed by `key` (see the template's
  // @for track) purely so a repeat toast recreates the element and
  // restarts its progress-bar animation instead of just patching one
  // that's already mid-flight.
  protected readonly toastList = computed(() => {
    const toast = this.toastService.toast();
    return toast ? [toast] : [];
  });

  protected dismiss(): void {
    this.toastService.dismiss();
  }
}
