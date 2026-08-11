import { Component, inject, signal } from '@angular/core';
import { ImageService, MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from '../../services/image.service';
import { ImageUploadDialogService } from './image-upload-dialog.service';
import { ToastService } from '../toast.service';

const MAX_SIZE_LABEL = `${MAX_IMAGE_SIZE_BYTES / 1024 / 1024} MB`;

@Component({
  selector: 'app-image-upload-dialog',
  imports: [],
  templateUrl: './image-upload-dialog.html',
  styleUrl: './image-upload-dialog.css',
})
export class ImageUploadDialog {
  private readonly imageService = inject(ImageService);
  private readonly dialogService = inject(ImageUploadDialogService);
  private readonly toastService = inject(ToastService);

  protected readonly isOpen = this.dialogService.isOpen;
  protected readonly maxSizeLabel = MAX_SIZE_LABEL;

  protected readonly selectedFile = signal<File | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly uploading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isDragging = signal(false);

  protected onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.setFile(file);
    input.value = ''; // allow re-selecting the same file after a cancel
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  protected onDragLeave(): void {
    this.isDragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files?.[0] ?? null;
    this.setFile(file);
  }

  private setFile(file: File | null): void {
    this.revokePreview();
    this.errorMessage.set(null);

    if (!file) {
      this.selectedFile.set(null);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.errorMessage.set('Only JPEG, PNG, GIF, and WEBP images are allowed.');
      this.selectedFile.set(null);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      this.errorMessage.set(`That file is too large — the limit is ${MAX_SIZE_LABEL}.`);
      this.selectedFile.set(null);
      return;
    }

    this.selectedFile.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
  }

  protected confirmUpload(): void {
    const file = this.selectedFile();
    if (!file || this.uploading()) return;

    this.uploading.set(true);
    const uploader = this.dialogService.uploader ?? ((f: File) => this.imageService.upload(f));
    uploader(file).subscribe({
      next: (response) => {
        this.uploading.set(false);
        void this.toastService.show('Image uploaded.', 'success', 2000);
        this.finish(response.imagePath);
      },
      error: (err) => {
        console.error('Image upload failed:', err);
        this.uploading.set(false);
        // the error interceptor already surfaced a toast for the HTTP failure
      },
    });
  }

  protected cancel(): void {
    this.finish(null);
  }

  private finish(url: string | null): void {
    this.revokePreview();
    this.selectedFile.set(null);
    this.errorMessage.set(null);
    this.dialogService.complete(url);
  }

  private revokePreview(): void {
    const current = this.previewUrl();
    if (current) URL.revokeObjectURL(current);
    this.previewUrl.set(null);
  }
}
