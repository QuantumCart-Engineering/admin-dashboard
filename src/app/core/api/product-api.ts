import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../config/app-config';
import type {
  CreateProductPayload,
  Product,
  ProductDetailResponse,
  ProductListResponse,
  ProductMutationResponse,
  ProductsQuery,
  ProductWithDetails,
  UpdateProductPayload,
} from '../models/catalog';

export interface ProductPage {
  data: Product[];
  nextCursor: string | null;
  limit: number;
  hasMore: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(query: ProductsQuery = {}): Observable<ProductPage> {
    let params = new HttpParams();

    if (query.cursor) {
      params = params.set('cursor', query.cursor);
    }
    if (query.limit !== undefined && query.limit !== null) {
      params = params.set('limit', String(query.limit));
    }
    if (query.categoryId) {
      params = params.set('categoryId', query.categoryId);
    }
    if (query.search) {
      params = params.set('search', query.search);
    }

    return this.http.get<ProductListResponse>(`${this.baseUrl}/api/v1/products`, { params }).pipe(
      map((res) => ({
        data: res.data,
        nextCursor: res.pagination.nextCursor,
        limit: res.pagination.limit,
        hasMore: res.pagination.hasMore,
      })),
    );
  }

  get(id: string): Observable<ProductWithDetails> {
    return this.http
      .get<ProductDetailResponse>(`${this.baseUrl}/api/v1/products/${id}`)
      .pipe(map((res) => res.data));
  }

  create(payload: CreateProductPayload): Observable<Product> {
    return this.http
      .post<ProductMutationResponse>(`${this.baseUrl}/api/v1/products`, payload)
      .pipe(map((res) => res.data));
  }

  update(id: string, payload: UpdateProductPayload): Observable<Product> {
    return this.http
      .put<ProductMutationResponse>(`${this.baseUrl}/api/v1/products/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  deactivate(id: string): Observable<void> {
    return this.http
      .delete<{ success: true; message?: string }>(`${this.baseUrl}/api/v1/products/${id}`)
      .pipe(map(() => undefined));
  }
}
