import { Component, DestroyRef, effect, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { RealtimeService } from '../../services/realtime.service';
import { MessageService } from '../../services/message.service';
import { MessagesBadgeService } from '../../services/messages-badge.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly realtimeService = inject(RealtimeService);
  private readonly messageService = inject(MessageService);
  private readonly messagesBadgeService = inject(MessagesBadgeService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currentUser = this.authService.currentUser;
  /** Phone/city/photo aren't in the JWT — fetched separately once someone's
   *  signed in; see UserService. Falls back to the initials chip until it
   *  loads (or if the user hasn't uploaded a photo). */
  protected readonly currentProfile = this.userService.currentProfile;
  protected readonly unreadCount = this.messagesBadgeService.unreadCount;

  /** currentUser() gets a brand-new object on every silent token refresh
   *  (see AuthService.storeSession — refresh calls it same as login), not
   *  just on an actual sign-in. Signals compare by reference, so an effect
   *  reading currentUser() re-fires on every refresh too; tracking the id
   *  we last connected for is what keeps connectMessaging() (and its "you
   *  have N new messages" toast) from re-running every ~15 minutes. */
  private connectedForUserId: string | null = null;

  constructor() {
    effect(() => {
      const user = this.currentUser();
      if (user) {
        this.userService.loadCurrentProfile(user.id);
        if (this.connectedForUserId !== user.id) {
          this.connectedForUserId = user.id;
          this.connectMessaging();
        }
      } else {
        this.connectedForUserId = null;
        this.userService.clearCurrentProfile();
        this.realtimeService.disconnect();
      }
    });

    // A message arriving live while the reader's elsewhere in the app —
    // the Messages page itself handles new messages for the thread that's
    // actually open (see Messages), this is purely the "elsewhere" case.
    // Re-fetches the real count from the server rather than incrementing a
    // local guess, so it can't drift from what's actually unread (e.g. if
    // the recipient has the sender's thread open elsewhere and the message
    // gets auto-marked read before this even runs).
    this.realtimeService.messageReceived$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((message) => {
      if (message.recipientId !== this.currentUser()?.id) return;
      this.refreshUnreadCount();
      void this.toastService.show(`New message from ${message.senderName}.`, 'info', 3500);
    });

    this.realtimeService.threadRead$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.refreshUnreadCount();
    });
  }

  /** Dashboard exists in the template's nav but isn't built yet — surface
   *  that instead of routing to a dead page. */
  protected notBuiltYet(): void {
    void this.toastService.show('Coming soon.', 'info', 2000);
  }

  protected signOut(): void {
    this.authService.logout().subscribe(() => {
      this.userService.clearCurrentProfile();
      this.realtimeService.disconnect();
      this.router.navigateByUrl('/');
    });
  }

  /** The JWT only carries a username, not separate first/last names —
   *  so the avatar chip is just the first two letters of it. */
  protected initials(userName: string): string {
    return userName.slice(0, 2).toUpperCase();
  }

  private connectMessaging(): void {
    this.realtimeService.connect();

    this.messageService.getUnreadCount().subscribe({
      next: (count) => {
        this.messagesBadgeService.setCount(count);
        if (count > 0) {
          void this.toastService.show(
            `You have ${count} new message${count === 1 ? '' : 's'} to read.`,
            'info',
            4000
          );
        }
      },
      error: (err) => console.error('Failed to load unread message count:', err),
    });
  }

  private refreshUnreadCount(): void {
    this.messageService.getUnreadCount().subscribe({
      next: (count) => this.messagesBadgeService.setCount(count),
      error: (err) => console.error('Failed to refresh unread message count:', err),
    });
  }
}
