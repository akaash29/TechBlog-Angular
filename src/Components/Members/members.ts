import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserService } from '../../app/services/user.service';
import { RealtimeService } from '../../app/services/realtime.service';
import { UserProfile } from '../../app/models/auth.models';

const PAGE_SIZE = 20;

/** Real data end to end: UserService talks to GET /api/users/paged (role
 *  filter + search, both server-side — see GetUsersPagedQuery). */
@Component({
  selector: 'app-members',
  imports: [FormsModule, DatePipe, RouterLink],
  templateUrl: './members.html',
  styleUrl: './members.css',
})
export class Members {
  private readonly userService = inject(UserService);
  private readonly realtimeService = inject(RealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  /** Live presence off the shared hub connection (started from Navbar) —
   *  falls back gracefully to "offline" for everyone if the connection
   *  hasn't come up yet, no separate REST call needed on this page. */
  protected readonly onlineUserIds = this.realtimeService.onlineUserIds;

  protected readonly members = signal<UserProfile[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly loading = signal(true);
  protected readonly activeRole = signal<string | null>(null);
  protected readonly searchTerm = signal('');
  protected readonly page = signal(1);

  protected readonly roles = ['Writer', 'Editor', 'Photographer', 'Reader'];

  private readonly search$ = new Subject<string>();

  constructor() {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.page.set(1);
        this.load();
      });

    this.load();
  }

  protected onSearchInput(value: string): void {
    this.search$.next(value.trim());
  }

  protected selectRole(role: string | null): void {
    if (role === this.activeRole()) return;
    this.activeRole.set(role);
    this.page.set(1);
    this.load();
  }

  protected nextPage(): void {
    if (this.page() * PAGE_SIZE >= this.totalCount()) return;
    this.page.update((p) => p + 1);
    this.load();
  }

  protected previousPage(): void {
    if (this.page() <= 1) return;
    this.page.update((p) => p - 1);
    this.load();
  }

  protected initials(profile: UserProfile): string {
    return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
  }

  protected isOnline(userId: string): boolean {
    return this.onlineUserIds().has(userId);
  }

  /** base.css defines a colour per role (.badge--writer/editor/photographer/
   *  reader) — Admin has no writers'-room equivalent, so it gets its own
   *  rule alongside them (see base.css). */
  protected roleBadgeClass(role: string): string {
    return `badge--${role.toLowerCase()}`;
  }

  private load(): void {
    this.loading.set(true);
    this.userService.getPaged(this.page(), PAGE_SIZE, this.activeRole(), this.searchTerm()).subscribe({
      next: (result) => {
        this.members.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load members:', err);
        this.loading.set(false);
      },
    });
  }
}
