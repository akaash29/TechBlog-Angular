import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UploadImageResponse } from '../models/blog.models';

/** Mirrors the API's ImageUploadConstraints — keep these two in sync. */
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

@Injectable({ providedIn: 'root' })
export class ImageService {
  private readonly http = inject(HttpClient);
  private readonly imagesBase = `${environment.apiBaseUrl}/images`;

  upload(file: File): Observable<UploadImageResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<UploadImageResponse>(`${this.imagesBase}/upload`, formData);
  }

  /** Deletes every image the caller uploaded that never made it into a
   *  saved post — blob storage files included. Called when the compose
   *  page's Clear button, or an unsaved-changes navigation prompt, is
   *  confirmed. */
  discardOrphaned(): Observable<void> {
    return this.http.post<void>(`${this.imagesBase}/discard-orphaned`, {});
  }
}
