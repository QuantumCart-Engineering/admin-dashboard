import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, firstValueFrom } from 'rxjs';
import { ProductApi } from '../../../core/api/product-api';
import { CategoryApi } from '../../../core/api/category-api';
import type { Category, Product } from '../../../core/models/catalog';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { ImageCacheService } from '../../../core/services/image-cache.service';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../shared/components/error-state/error-state';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { ProductThumb } from '../../../shared/components/product-thumb/product-thumb';
import { formatCurrency } from '../../../core/utils/money';
import { productStatusLabel, productStatusTone, toneClass } from '../../../core/utils/status';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-products-list-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, EmptyState, ErrorState, Skeleton, ProductThumb],
  templateUrl: './products-list-page.html',
  styleUrl: './products-list-page.css',
})
export class ProductsListPage implements OnInit {
  private readonly productApi = inject(ProductApi);
  private readonly categoryApi = inject(CategoryApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly imageCache = inject(ImageCacheService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly hasMore = signal(false);
  readonly pageIndex = signal(0);

  readonly formatCurrency = formatCurrency;
  readonly productStatusLabel = productStatusLabel;
  readonly toneClass = toneClass;
  readonly productStatusTone = productStatusTone;

  private categoryId = signal<string>('');
  private nextCursor: string | null = null;
  private cursorStack: (string | null)[] = [];
  private currentCursor: string | null = null;

  ngOnInit(): void {
    void this.loadCategories();
    void this.load();

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.resetPagination();
        void this.load();
      });
  }

  onCategoryChange(value: string) {
    this.categoryId.set(value);
    this.resetPagination();
    void this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set(false);
    try {
      const page = await firstValueFrom(
        this.productApi.list({
          limit: PAGE_SIZE,
          cursor: this.currentCursor,
          categoryId: this.categoryId() || undefined,
          search: this.searchControl.value.trim() || undefined,
        }),
      );

      this.products.set(page.data);
      this.nextCursor = page.nextCursor;
      this.hasMore.set(page.hasMore);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  nextPage() {
    if (!this.hasMore() || !this.nextCursor) {
      return;
    }
    this.cursorStack.push(this.currentCursor);
    this.currentCursor = this.nextCursor;
    this.pageIndex.update((p) => p + 1);
    void this.load();
  }

  previousPage() {
    if (!this.cursorStack.length) {
      return;
    }
    this.currentCursor = this.cursorStack.pop() ?? null;
    this.pageIndex.update((p) => Math.max(0, p - 1));
    void this.load();
  }

  canGoPrevious(): boolean {
    return this.cursorStack.length > 0;
  }

  goNew() {
    void this.router.navigate(['/products', 'new']);
  }

  private resetPagination() {
    this.currentCursor = null;
    this.nextCursor = null;
    this.cursorStack = [];
    this.pageIndex.set(0);
    this.hasMore.set(false);
  }

  private async loadCategories() {
    try {
      const categories = await firstValueFrom(this.categoryApi.list());
      this.categories.set(categories);
    } catch {
      // non-critical: filter simply stays empty
    }
  }

  async deactivate(product: Product) {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Deactivate product',
      message: `“${product.name}” will be hidden from the storefront. This action cannot be undone from the admin console.`,
      confirmLabel: 'Deactivate',
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    try {
      await firstValueFrom(this.productApi.deactivate(product.id));
      this.imageCache.invalidate(product.id);
      this.notify.showSuccess('Product deactivated');
      this.products.update((list) => list.filter((p) => p.id !== product.id));
    } catch {
      // error interceptor surfaces the message
    }
  }
}
