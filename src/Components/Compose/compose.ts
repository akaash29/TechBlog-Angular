import { Component, ElementRef, PLATFORM_ID, ViewChild, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../app/services/category.service';
import { BlogPostService } from '../../app/services/blog-post.service';
import { ImageService } from '../../app/services/image.service';
import { ImageUploadDialogService } from '../../app/shared/image-upload-dialog/image-upload-dialog.service';
import { ToastService } from '../../app/shared/toast.service';
import { BlogPost, Category } from '../../app/models/blog.models';
import { MAX_IMAGE_SIZE_BYTES } from '../../app/services/image.service';
import { ComposeCanDeactivate } from '../../app/guards/compose-deactivate.guard';

const UNSAVED_CHANGES_PROMPT = 'Changes are not saved. Are you sure you want to cancel?';

/** The rich-text editor, live preview, admin gate, and formatting
 *  toolbar are all driven by the vendored compose.js (LW.bootCompose)
 *  against these element ids — see app.ts for the re-run hook. This
 *  component owns everything compose.js doesn't: the meta fields
 *  (title/description/category), image upload, validation, saving to
 *  the API, and the unsaved-changes guard (Clear button + navigating
 *  away — see canDeactivate and composeDeactivateGuard). */
@Component({
  selector: 'app-compose',
  imports: [ReactiveFormsModule],
  templateUrl: './compose.html',
  styleUrl: './compose.css',
})
export class Compose implements ComposeCanDeactivate {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);
  private readonly blogPostService = inject(BlogPostService);
  private readonly imageService = inject(ImageService);
  private readonly imageUploadDialogService = inject(ImageUploadDialogService);
  private readonly toastService = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('fImg') private readonly fImgRef?: ElementRef<HTMLInputElement>;

  protected readonly categories = signal<Category[]>([]);
  protected readonly coverImagePath = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly maxImageSizeLabel = `${MAX_IMAGE_SIZE_BYTES / 1024 / 1024} MB`;

  /** Anything typed into the headline/standfirst/category, the body editor,
   *  or a cover image picked, since the last successful save (or the last
   *  Clear). Drives both the Clear button's confirm and the CanDeactivate
   *  guard — see onClear()/canDeactivate(). */
  protected readonly hasUnsavedChanges = signal(false);

  protected readonly composeForm = this.fb.group({
    title: this.fb.nonNullable.control('', Validators.maxLength(300)),
    description: this.fb.nonNullable.control('', Validators.maxLength(500)),
    categoryId: this.fb.control<number | null>(null, Validators.required),
  });

  protected get title() {
    return this.composeForm.controls.title;
  }

  protected get description() {
    return this.composeForm.controls.description;
  }

  protected get category() {
    return this.composeForm.controls.categoryId;
  }

  constructor() {
    this.categoryService.getAll().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (err) => console.error('Failed to load categories:', err),
    });

    // Any real edit to the meta fields counts as an unsaved change — but
    // composeForm.reset() (used by onClear()) also fires valueChanges, so
    // that path explicitly sets hasUnsavedChanges back to false afterwards
    // rather than this subscription trying to tell the two apart.
    this.composeForm.valueChanges.subscribe(() => this.hasUnsavedChanges.set(true));

    // Bridge so compose.js's inline "image" toolbar button can open this
    // same dialog instead of its original window.prompt() URL entry.
    if (isPlatformBrowser(this.platformId)) {
      window.LW = window.LW ?? {};
      window.LW.openImageUpload = (callback) => {
        void this.imageUploadDialogService.open().then((url) => callback(url));
      };
    }
  }

  /** Keeps coverImagePath in sync when fImg's value changes outside of
   *  openCoverImagePicker() — currently only LW.resetComposeEditor (see
   *  onClear()), which resets the field then dispatches an 'input' event
   *  by hand. */
  protected onCoverImageInput(value: string): void {
    this.coverImagePath.set(value || null);
    this.hasUnsavedChanges.set(true);
  }

  /** The body editor (#editorArea) isn't a reactive form control — its
   *  content is only ever read on demand (see readEditorHtml()) — so this
   *  is the one field that needs its own explicit dirty-tracking hook. */
  protected onEditorInput(): void {
    this.hasUnsavedChanges.set(true);
  }

  protected async openCoverImagePicker(): Promise<void> {
    const url = await this.imageUploadDialogService.open();
    if (!url) return;

    // Set imperatively and dispatch 'input' by hand rather than binding
    // [value] — compose.js's own syncCover() listens for a native 'input'
    // event on this element to refresh the live preview (which Angular's
    // property binding wouldn't fire on its own), and onCoverImageInput
    // picks the same event up to update coverImagePath.
    const input = this.fImgRef?.nativeElement;
    if (input) {
      input.value = url;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  protected onPublish(): void {
    this.save(false);
  }

  protected onSaveDraft(): void {
    this.save(true);
  }

  /** The Clear button — confirms (only if there's actually something to
   *  lose), resets the editor, then discards whatever images were uploaded
   *  for this still-unsaved writing session (both the blob storage files
   *  and their UploadedImage rows — see DiscardOrphanedImagesCommand). An
   *  already-saved post's images are untouched: LinkOrphanedImagesAsync
   *  ties them to the post the moment it's saved, so they're no longer
   *  "orphaned" by the time this runs. */
  protected onClear(): void {
    if (this.hasUnsavedChanges() && !confirm(UNSAVED_CHANGES_PROMPT)) {
      return;
    }

    window.LW?.resetComposeEditor?.();
    this.coverImagePath.set(null);
    this.hasUnsavedChanges.set(false);
    this.discardOrphanedImages();
    void this.toastService.show('Editor cleared.', 'info', 2000);
  }

  /** CanDeactivate hook (see composeDeactivateGuard) — runs on every attempt
   *  to navigate away from /compose, not just the Clear button. Same prompt,
   *  same cleanup; the only difference is the editor itself doesn't need
   *  resetting since the component is about to be destroyed anyway. */
  canDeactivate(): boolean {
    if (!this.hasUnsavedChanges()) {
      return true;
    }
    if (!confirm(UNSAVED_CHANGES_PROMPT)) {
      return false;
    }

    this.hasUnsavedChanges.set(false);
    this.discardOrphanedImages();
    return true;
  }

  /** Fire-and-forget: HttpClient requests aren't tied to this component's
   *  lifecycle, so this still completes even though Compose is being torn
   *  down (or already has been) by the time it resolves. */
  private discardOrphanedImages(): void {
    this.imageService.discardOrphaned().subscribe({
      error: (err) => console.error('Failed to discard orphaned images:', err),
    });
  }

  private save(isDraft: boolean): void {
    const { title, description, categoryId } = this.composeForm.getRawValue();

    if (categoryId == null) {
      this.category.markAsTouched();
      void this.toastService.show('Choose a category first.', 'error', 3000);
      return;
    }

    const bodyHtml = this.readEditorHtml();

    if (!isDraft) {
      if (!title.trim()) {
        this.title.markAsTouched();
        void this.toastService.show('Add a headline before publishing.', 'error', 3000);
        return;
      }
      if (!description.trim()) {
        this.description.markAsTouched();
        void this.toastService.show('Add a standfirst before publishing.', 'error', 3000);
        return;
      }
      if (!bodyHtml) {
        void this.toastService.show('Write something before publishing.', 'error', 3000);
        return;
      }
    }

    if (this.composeForm.invalid) {
      this.composeForm.markAllAsTouched();
      void this.toastService.show('Check the highlighted fields.', 'error', 3000);
      return;
    }

    this.submitting.set(true);
    this.blogPostService
      .create({
        Title: title,
        Description: description,
        PostHtml: bodyHtml,
        CoverImagePath: this.coverImagePath(),
        CategoryId: categoryId,
        IsDraft: isDraft,
      })
      .subscribe({
        next: (post) => {
          this.submitting.set(false);
          // The current content is now persisted — nothing left to lose by
          // clearing or navigating away without a fresh prompt.
          this.hasUnsavedChanges.set(false);
          void this.toastService.show(this.saveResultMessage(post), 'success', 2500);
        },
        error: (err) => {
          // the error interceptor already surfaced a toast for the HTTP failure
          console.error('Save post failed:', err);
          this.submitting.set(false);
        },
      });
  }

  /** Publishing doesn't always mean "live right now" — a non-admin's
   *  publish lands in PendingApproval until an admin reviews it (see
   *  CreateBlogPostCommandHandler) — so the confirmation reflects
   *  whatever Status the API actually saved it as, not just which button
   *  was clicked. */
  private saveResultMessage(post: BlogPost): string {
    switch (post.status) {
      case 'Draft':
        return 'Draft saved.';
      case 'PendingApproval':
        return `Submitted "${post.title}" for approval.`;
      case 'Published':
        return `Published "${post.title}" to the Journal.`;
    }
  }

  private readEditorHtml(): string {
    if (!isPlatformBrowser(this.platformId)) return '';
    return (document.getElementById('editorArea')?.innerHTML ?? '').trim();
  }
}
