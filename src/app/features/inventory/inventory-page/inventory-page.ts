import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, firstValueFrom } from 'rxjs';
import { ProductApi } from '../../../core/api/product-api';
import { InventoryApi } from '../../../core/api/inventory-api';
import type { Product } from '../../../core/models/catalog';
import type { Inventory } from '../../../core/models/inventory';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../shared/components/error-state/error-state';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { formatCurrency } from '../../../core/utils/money';

type LoadState = 'idle' | 'loading' | 'loaded' | 'not-found' | 'unavailable' | 'error';

@Component({
  selector: 'app-inventory-page',
  standalone: true,
  imports: [ReactiveFormsModule, EmptyState, ErrorState, Skeleton],
  templateUrl: './inventory-page.html',
  styleUrl: './inventory-page.css',
})
export class InventoryPage {
  private readonly productApi = inject(ProductApi);
  private readonly inventoryApi = inject(InventoryApi);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly results = signal<Product[]>([]);
  readonly searching = signal(false);
  readonly searched = signal(false);

  readonly selected = signal<Product | null>(null);
  readonly inventory = signal<Inventory | null>(null);
  readonly state = signal<LoadState>('idle');
  readonly errorMessage = signal('');

  readonly formatCurrency = formatCurrency;

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((term) => void this.search(term));
  }

  private async search(term: string) {
    const query = term.trim();
    if (!query) {
      this.results.set([]);
      this.searched.set(false);
      return;
    }

    this.searching.set(true);
    try {
      const page = await firstValueFrom(this.productApi.list({ search: query, limit: 8 }));
      this.results.set(page.data);
      this.searched.set(true);
    } catch {
      this.results.set([]);
      this.searched.set(true);
    } finally {
      this.searching.set(false);
    }
  }

  async select(product: Product) {
    this.selected.set(product);
    this.state.set('loading');
    this.inventory.set(null);
    this.errorMessage.set('');

    try {
      const inventory = await firstValueFrom(this.inventoryApi.getByProduct(product.id));
      this.inventory.set(inventory);
      this.state.set('loaded');
    } catch (err) {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 404) {
          this.state.set('not-found');
          return;
        }
        if (err.status === 0 || err.status >= 500) {
          this.state.set('unavailable');
          this.errorMessage.set('The inventory service is not reachable right now.');
          return;
        }
      }
      this.state.set('error');
      this.errorMessage.set('Inventory could not be loaded for this product.');
    }
  }

  clearSelection() {
    this.selected.set(null);
    this.inventory.set(null);
    this.state.set('idle');
  }
}
