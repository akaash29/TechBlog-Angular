import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';

/** Uploads a file and resolves with the resulting public URL. Defaults to
 *  the generic compose-editor upload (ImageService) when open() is called
 *  with no argument; callers with a different destination (e.g. a user's
 *  profile photo) pass their own. */
export type ImageUploader = (file: File) => Observable<{ imagePath: string }>;

/** Opens the single, app-wide image upload dialog (mounted once via
 *  <app-image-upload-dialog/> — see app.html) and resolves with the
 *  uploaded image's URL, or null if the user cancelled. Used both from
 *  Angular (the cover image picker, the profile photo picker) and, via a
 *  window.LW bridge, from the vendored compose.js editor's inline image
 *  toolbar button. */
@Injectable({ providedIn: 'root' })
export class ImageUploadDialogService {
  private readonly _isOpen = signal(false);
  readonly isOpen = this._isOpen.asReadonly();

  private pendingResolve: ((url: string | null) => void) | null = null;
  private _uploader: ImageUploader | null = null;

  /** @param uploader Where to send the file — omit for the default (generic
   *  compose image) upload. */
  open(uploader?: ImageUploader): Promise<string | null> {
    // Only one upload flow at a time — cancel whatever was pending.
    this.pendingResolve?.(null);

    this._uploader = uploader ?? null;
    this._isOpen.set(true);
    return new Promise((resolve) => {
      this.pendingResolve = resolve;
    });
  }

  /** Read by ImageUploadDialog to decide where a confirmed file goes. */
  get uploader(): ImageUploader | null {
    return this._uploader;
  }

  /** Called by ImageUploadDialog itself once the user confirms or cancels. */
  complete(url: string | null): void {
    this._isOpen.set(false);
    this.pendingResolve?.(url);
    this.pendingResolve = null;
    this._uploader = null;
  }
}
