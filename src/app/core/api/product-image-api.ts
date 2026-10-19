import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../config/app-config';
import type { ProductImage } from '../models/catalog';

interface ProductImageResponse {
  success: true;
  message?: string;
  data: ProductImage;
}

interface ProductImageListResponse {
  success: true;
  data: ProductImage[];
}

@Injectable({ providedIn: 'root' })
export class ProductImageApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(productId: string): Observable<ProductImage[]> {
    return this.http
      .get<ProductImageListResponse>(`${this.baseUrl}/api/v1/products/${productId}/images`)
      .pipe(map((res) => res.data));
  }

  /**
   * Upload a single image. Emits HttpClient events so callers can render
   * upload progress (`HttpEventType.UploadProgress`) and the final image
   * (`HttpEventType.Response`).
   */
  upload(
    productId: string,
    file: File,
    altText?: string,
  ): Observable<HttpEvent<ProductImageResponse>> {
    const form = new FormData();
    form.append('image', file, file.name);
    if (altText && altText.trim()) {
      form.append('altText', altText.trim());
    }

    const req = new HttpRequest('POST', `${this.baseUrl}/api/v1/products/${productId}/images`, form, {
      reportProgress: true,
    });

    return this.http.request<ProductImageResponse>(req);
  }

  remove(productId: string, imageId: string): Observable<void> {
    return this.http
      .delete<{ success: true; message?: string }>(
        `${this.baseUrl}/api/v1/products/${productId}/images/${imageId}`,
      )
      .pipe(map(() => undefined));
  }

  /** Absolute URL for a stored image relative path returned by the API. */
  resolveUrl(relativeUrl: string): string {
    if (/^https?:\/\//i.test(relativeUrl)) {
      return relativeUrl;
    }
    return `${this.baseUrl}${relativeUrl}`;
  }
}
