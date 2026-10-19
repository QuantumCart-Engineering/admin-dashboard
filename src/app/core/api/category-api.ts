import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../config/app-config';
import type {
  Category,
  CategoryListResponse,
  CategoryResponse,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '../models/catalog';

@Injectable({ providedIn: 'root' })
export class CategoryApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<Category[]> {
    return this.http
      .get<CategoryListResponse>(`${this.baseUrl}/api/v1/categories`)
      .pipe(map((res) => res.data));
  }

  get(id: string): Observable<Category> {
    return this.http
      .get<CategoryResponse>(`${this.baseUrl}/api/v1/categories/${id}`)
      .pipe(map((res) => res.data));
  }

  create(payload: CreateCategoryPayload): Observable<Category> {
    return this.http
      .post<CategoryResponse>(`${this.baseUrl}/api/v1/categories`, payload)
      .pipe(map((res) => res.data));
  }

  update(id: string, payload: UpdateCategoryPayload): Observable<Category> {
    return this.http
      .put<CategoryResponse>(`${this.baseUrl}/api/v1/categories/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete<{ success: true; message?: string }>(`${this.baseUrl}/api/v1/categories/${id}`)
      .pipe(map(() => undefined));
  }
}
