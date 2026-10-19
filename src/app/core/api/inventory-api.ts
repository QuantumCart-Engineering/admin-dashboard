import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../config/app-config';
import type { Inventory, InventoryResponse } from '../models/inventory';

@Injectable({ providedIn: 'root' })
export class InventoryApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getByProduct(productId: string): Observable<Inventory> {
    return this.http
      .get<InventoryResponse>(`${this.baseUrl}/api/v1/inventory/${productId}`)
      .pipe(map((res) => res.data));
  }
}
