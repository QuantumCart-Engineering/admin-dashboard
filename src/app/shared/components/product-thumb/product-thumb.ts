import { Component, DestroyRef, Input, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ImageCacheService } from '../../../core/services/image-cache.service';
import { initials } from '../../../core/utils/placeholder';

@Component({
  selector: 'app-product-thumb',
  standalone: true,
  template: `
    @if (url()) {
      <img class="thumb" [src]="url()!" [alt]="name" loading="lazy" />
    } @else {
      <span class="thumb-placeholder" aria-hidden="true">{{ initials(name) }}</span>
    }
  `,
})
export class ProductThumb {
  private readonly cache = inject(ImageCacheService);
  private readonly destroyRef = inject(DestroyRef);

  readonly url = signal<string | null>(null);
  readonly initials = initials;

  private _productId: string | null = null;
  @Input({ required: true })
  set productId(value: string) {
    this._productId = value;
    this.url.set(null);
    if (value) {
      this.cache
        .firstImage(value)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((resolved) => this.url.set(resolved));
    }
  }

  @Input() name = '';
}
