import { HttpEventType } from '@angular/common/http';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { ProductImageApi } from '../../../core/api/product-image-api';
import type { ProductImage } from '../../../core/models/catalog';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogService } from '../confirm-dialog/confirm-dialog.service';
import {
  ACCEPTED_IMAGE_ACCEPT_ATTR,
  formatBytes,
  MAX_IMAGE_BYTES,
  validateImageFile,
} from '../../../core/utils/files';

@Component({
  selector: 'app-image-gallery',
  standalone: true,
  templateUrl: './image-gallery.html',
  styleUrl: './image-gallery.css',
})
export class ImageGallery {
  private readonly api = inject(ProductImageApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  private _productId = '';
  @Input({ required: true })
  set productId(value: string) {
    if (value !== this._productId) {
      this._productId = value;
      void this.load();
    }
  }
  get productId(): string {
    return this._productId;
  }

  @Output() changed = new EventEmitter<void>();

  readonly images = signal<ProductImage[]>([]);
  readonly loading = signal(false);
  readonly uploading = signal(false);
  readonly progress = signal(0);
  readonly dragging = signal(false);
  readonly altText = signal('');

  readonly accept = ACCEPTED_IMAGE_ACCEPT_ATTR;
  readonly maxLabel = formatBytes(MAX_IMAGE_BYTES);

  resolveUrl(url: string): string {
    return this.api.resolveUrl(url);
  }

  async load() {
    if (!this._productId) {
      this.images.set([]);
      return;
    }
    this.loading.set(true);
    try {
      const images = await this.loadImages();
      images.sort((a, b) => a.position - b.position);
      this.images.set(images);
    } catch {
      // error interceptor surfaces the message
    } finally {
      this.loading.set(false);
    }
  }

  private loadImages(): Promise<ProductImage[]> {
    return new Promise((resolve, reject) => {
      this.api.list(this._productId).subscribe({ next: resolve, error: reject });
    });
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      void this.uploadFiles(Array.from(input.files));
    }
    input.value = '';
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragging.set(false);
    const files = event.dataTransfer?.files;
    if (files?.length) {
      void this.uploadFiles(Array.from(files));
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragging.set(false);
  }

  private async uploadFiles(files: File[]) {
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        this.notify.showError(`${file.name}: ${validation.error}`);
        continue;
      }
      const ok = await this.uploadOne(file);
      if (!ok) {
        break;
      }
    }
  }

  private uploadOne(file: File): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.uploading.set(true);
      this.progress.set(0);

      this.api.upload(this._productId, file, this.altText()).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.progress.set(Math.round((event.loaded / event.total) * 100));
          } else if (event.type === HttpEventType.Response) {
            this.notify.showSuccess('Image uploaded');
            this.altText.set('');
            void this.load();
            this.changed.emit();
          }
        },
        error: () => {
          this.uploading.set(false);
          this.progress.set(0);
          resolve(false);
        },
        complete: () => {
          this.uploading.set(false);
          this.progress.set(0);
          resolve(true);
        },
      });
    });
  }

  async remove(image: ProductImage) {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete image',
      message: 'This image will be permanently removed from the product. Continue?',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    try {
      await new Promise<void>((resolve, reject) => {
        this.api.remove(this._productId, image.id).subscribe({ next: () => resolve(), error: reject });
      });
      this.notify.showSuccess('Image deleted');
      this.images.update((list) => list.filter((i) => i.id !== image.id));
      this.changed.emit();
    } catch {
      // error interceptor surfaces the message
    }
  }
}
