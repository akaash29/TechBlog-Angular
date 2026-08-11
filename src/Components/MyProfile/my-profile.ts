import { Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { AuthService } from '../../app/services/auth.service';
import { UserService } from '../../app/services/user.service';
import { BlogPostService } from '../../app/services/blog-post.service';
import { ImageUploadDialogService } from '../../app/shared/image-upload-dialog/image-upload-dialog.service';
import { ToastService } from '../../app/shared/toast.service';
import { AuthorStats } from '../../app/models/blog.models';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** The cover level-meter and recent work list are decorative/sample content
 *  from the vendored profile.js and aren't wired to real data — everything
 *  else on this page (identity, edit/save, profile photo, the stat strip
 *  and "reads this week") is owned here. */
@Component({
  selector: 'app-my-profile',
  imports: [RouterLink, ReactiveFormsModule, DatePipe],
  templateUrl: './my-profile.html',
  styleUrl: './my-profile.css',
})
export class MyProfile {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly blogPostService = inject(BlogPostService);
  private readonly imageUploadDialogService = inject(ImageUploadDialogService);
  private readonly toastService = inject(ToastService);

  protected readonly profile = this.userService.currentProfile;
  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly uploadingPhoto = signal(false);

  protected readonly stats = signal<AuthorStats | null>(null);
  protected readonly statsLoading = signal(true);

  /** The tallest bar in the sparkline is always 100% — everything else is
   *  scaled relative to it, so a quiet week doesn't render as 7 empty bars
   *  and a busy week doesn't clip. */
  private readonly maxWeeklyReads = computed(() =>
    Math.max(1, ...(this.stats()?.readsThisWeek.map((d) => d.count) ?? [0]))
  );
  protected readonly weekTotal = computed(() =>
    (this.stats()?.readsThisWeek ?? []).reduce((sum, d) => sum + d.count, 0)
  );

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    phone: ['', [Validators.maxLength(20), Validators.pattern(/^[0-9+\-\s()]*$/)]],
    city: ['', Validators.maxLength(100)],
  });

  protected get firstName() {
    return this.form.controls.firstName;
  }

  protected get lastName() {
    return this.form.controls.lastName;
  }

  protected get phone() {
    return this.form.controls.phone;
  }

  protected get city() {
    return this.form.controls.city;
  }

  constructor() {
    this.form.disable();

    const userId = this.authService.currentUser()?.id;
    if (userId) {
      this.userService.loadCurrentProfile(userId);
    }

    this.loadStats();

    // Keeps the form's values in sync with whatever profile is currently
    // loaded, but never while an edit is in progress — otherwise a profile
    // photo upload (which also refreshes currentProfile) would blow away
    // unsaved text-field changes.
    effect(() => {
      const profile = this.profile();
      if (profile && !this.editing()) {
        this.resetFormTo(profile.firstName, profile.lastName, profile.phone, profile.city);
      }
    });
  }

  protected initials(): string {
    const profile = this.profile();
    if (!profile) return '';
    return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase() || '—';
  }

  protected toggleEditing(): void {
    if (this.editing()) {
      this.cancelEditing();
      return;
    }
    this.editing.set(true);
    this.form.enable();
  }

  protected cancelEditing(): void {
    const profile = this.profile();
    if (profile) {
      this.resetFormTo(profile.firstName, profile.lastName, profile.phone, profile.city);
    }
    this.form.disable();
    this.editing.set(false);
    void this.toastService.show('Changes discarded.', 'info', 2000);
  }

  protected saveChanges(): void {
    const profile = this.profile();
    if (!profile || this.saving()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void this.toastService.show('Check the highlighted fields.', 'error', 3000);
      return;
    }

    const { firstName, lastName, phone, city } = this.form.getRawValue();

    this.saving.set(true);
    this.userService
      .update(profile.id, {
        FirstName: firstName.trim(),
        LastName: lastName.trim(),
        Phone: phone.trim() || null,
        City: city.trim() || null,
        // Role/active status aren't editable from this form — the API keeps
        // a non-admin's existing values regardless of what's sent, but
        // round-tripping them here keeps the request shape self-explanatory.
        Role: profile.role,
        IsActive: profile.isActive,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.disable();
          this.editing.set(false);
          void this.toastService.show('Profile saved.', 'success', 2000);
        },
        error: (err) => {
          console.error('Profile update failed:', err);
          this.saving.set(false);
        },
      });
  }

  protected async changePhoto(): Promise<void> {
    const profile = this.profile();
    if (!profile || this.uploadingPhoto()) return;

    this.uploadingPhoto.set(true);
    try {
      await this.imageUploadDialogService.open((file) =>
        this.userService
          .uploadProfileImage(profile.id, file)
          .pipe(map((updated) => ({ imagePath: updated.profileImagePath ?? '' })))
      );
    } finally {
      this.uploadingPhoto.set(false);
    }
  }

  /** Messages isn't built yet — surface that instead of a dead link. */
  protected notBuiltYet(): void {
    void this.toastService.show('Coming soon.', 'info', 2000);
  }

  /** This day's sparkline bar height, relative to the week's busiest day. */
  protected barHeightPercent(count: number): number {
    return Math.round((count / this.maxWeeklyReads()) * 100);
  }

  /** DailyReadCount.date is a plain "yyyy-MM-dd" (System.Text.Json's default
   *  DateOnly format) — built into a local Date from its parts rather than
   *  passed straight to `new Date(string)`, which treats a date-only ISO
   *  string as UTC and can render the wrong weekday near a timezone
   *  boundary. */
  protected dayLabel(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    return DAY_LETTERS[new Date(year, month - 1, day).getDay()];
  }

  private loadStats(): void {
    this.statsLoading.set(true);
    this.blogPostService.getMyStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.statsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load profile stats:', err);
        this.statsLoading.set(false);
      },
    });
  }

  private resetFormTo(firstName: string, lastName: string, phone: string | null, city: string | null): void {
    this.form.reset({
      firstName,
      lastName,
      phone: phone ?? '',
      city: city ?? '',
    });
  }
}
