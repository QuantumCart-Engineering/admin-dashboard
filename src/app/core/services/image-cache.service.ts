import { inject, Injectable } from '@angular/core';
import { Observable, of, shareReplay, catchError, map } from 'rxjs';
import { ProductImageApi } from '../api/product-image-api';

@Injectable({ providedIn: 'root' })
export class ImageCacheService {
  private readonly api = inject(ProductImageApi);
  private readonly cache = new Map<string, Observable<string | null>>();

  /**
   * Resolve the primary (lowest-position) image URL for a product. Results are
   * cached per product so scrolling a paginated list does not refetch images
   * for products that are already visible.
   */
  firstImage(productId: string): Observable<string | null> {
    const cached = this.cache.get(productId);
    if (cached) {
      return cached;
    }

    const request$ = this.api.list(productId).pipe(
      map((images) => {
        if (!images.length) {
          return null;
        }
        const primary = [...images].sort((a, b) => a.position - b.position)[0];
        return this.api.resolveUrl(primary.url);
      }),
      catchError(() => of(null)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.cache.set(productId, request$);
    return request$;
  }

  invalidate(productId: string): void {
    this.cache.delete(productId);
  }
}
