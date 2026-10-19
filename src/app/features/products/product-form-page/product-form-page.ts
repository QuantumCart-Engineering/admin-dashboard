import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ProductApi } from '../../../core/api/product-api';
import { CategoryApi } from '../../../core/api/category-api';
import type { Category, ProductWithDetails } from '../../../core/models/catalog';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { ImageGallery } from '../../../shared/components/image-gallery/image-gallery';
import { ErrorState } from '../../../shared/components/error-state/error-state';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { ImageCacheService } from '../../../core/services/image-cache.service';
import { formatCurrency } from '../../../core/utils/money';
import { productStatusLabel, productStatusTone, toneClass } from '../../../core/utils/status';

const atLeastOneCategory: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value as string[];
  return Array.isArray(value) && value.length > 0 ? null : { required: true };
};

@Component({
  selector: 'app-product-form-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ImageGallery, ErrorState, Skeleton],
  templateUrl: './product-form-page.html',
  styleUrl: './product-form-page.css',
})
export class ProductFormPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productApi = inject(ProductApi);
  private readonly categoryApi = inject(CategoryApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly imageCache = inject(ImageCacheService);

  readonly productId = signal<string | null>(null);
  readonly isEdit = signal(false);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly product = signal<ProductWithDetails | null>(null);
  readonly categories = signal<Category[]>([]);

  readonly formatCurrency = formatCurrency;
  readonly productStatusLabel = productStatusLabel;
  readonly productStatusTone = productStatusTone;
  readonly toneClass = toneClass;

  private navigatingAway = false;

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(255)],
    }),
    sku: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    }),
    description: new FormControl('', { nonNullable: true }),
    price: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01)],
    }),
    stockQuantity: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)],
    }),
    categoryIds: new FormControl<string[]>([], {
      nonNullable: true,
      validators: [atLeastOneCategory],
    }),
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId.set(id);
      this.isEdit.set(true);
    }
    void this.init();
  }

  private async init() {
    this.loading.set(true);
    this.loadError.set(false);
    try {
      const categories = await firstValueFrom(this.categoryApi.list());
      this.categories.set(categories);

      if (this.isEdit() && this.productId()) {
        const product = await firstValueFrom(this.productApi.get(this.productId()!));
        this.product.set(product);
        this.populate(product);
      }
    } catch {
      this.loadError.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  reload() {
    void this.init();
  }

  shortDate(value: string | undefined): string {
    return value ? value.slice(0, 10) : '—';
  }

  private populate(product: ProductWithDetails) {
    this.form.setValue({
      name: product.name,
      sku: product.sku,
      description: product.description ?? '',
      price: product.price,
      stockQuantity: product.stock_quantity,
      categoryIds: product.categoryIds ?? [],
    });
    this.form.markAsPristine();
  }

  isCategorySelected(id: string): boolean {
    return this.form.controls.categoryIds.value.includes(id);
  }

  toggleCategory(id: string, checked: boolean) {
    const current = this.form.controls.categoryIds.value;
    const next = checked ? [...current, id] : current.filter((c) => c !== id);
    this.form.controls.categoryIds.setValue(next);
    this.form.controls.categoryIds.markAsDirty();
    this.form.controls.categoryIds.markAsTouched();
  }

  // ---- validation helpers ----
  showError(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  fieldError(controlName: 'name' | 'sku' | 'price' | 'stockQuantity'): string {
    const control = this.form.controls[controlName];
    if (control.errors?.['required']) {
      return 'This field is required.';
    }
    if (control.errors?.['minlength']) {
      return `Must be at least ${control.errors['minlength'].requiredLength} characters.`;
    }
    if (control.errors?.['maxlength']) {
      return `Must be at most ${control.errors['maxlength'].requiredLength} characters.`;
    }
    if (control.errors?.['min']) {
      return controlName === 'price' ? 'Price must be greater than 0.' : 'Must be 0 or more.';
    }
    if (control.errors?.['pattern']) {
      return 'Must be a whole number.';
    }
    return 'Invalid value.';
  }

  categoryError(): boolean {
    const control = this.form.controls.categoryIds;
    return control.invalid && (control.touched || control.dirty);
  }

  private buildPayload() {
    const value = this.form.getRawValue();
    const description = value.description.trim();
    return {
      name: value.name.trim(),
      sku: value.sku.trim(),
      description: description.length ? description : undefined,
      price: Number(value.price),
      stockQuantity: Number(value.stockQuantity),
      categoryIds: value.categoryIds,
    };
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const payload = this.buildPayload();

    try {
      if (this.isEdit() && this.productId()) {
        const updated = await firstValueFrom(this.productApi.update(this.productId()!, payload));
        this.notify.showSuccess('Product updated');
        this.form.markAsPristine();
        this.product.update((p) => (p ? { ...p, ...updated, categoryIds: payload.categoryIds } : p));
      } else {
        const created = await firstValueFrom(this.productApi.create(payload));
        this.notify.showSuccess('Product created');
        this.navigatingAway = true;
        await this.router.navigate(['/products', created.id]);
      }
    } catch {
      // error interceptor surfaces the message (e.g. duplicate SKU/name)
    } finally {
      this.saving.set(false);
    }
  }

  onImagesChanged() {
    if (this.productId()) {
      this.imageCache.invalidate(this.productId()!);
    }
  }

  async deactivate() {
    const product = this.product();
    if (!product) {
      return;
    }
    const confirmed = await this.confirmDialog.confirm({
      title: 'Deactivate product',
      message: `“${product.name}” will be hidden from the storefront. This cannot be undone here.`,
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
      this.navigatingAway = true;
      await this.router.navigate(['/products']);
    } catch {
      // error interceptor surfaces the message
    }
  }

  cancel() {
    void this.router.navigate(['/products']);
  }

  async canDeactivate(): Promise<boolean> {
    if (this.navigatingAway || this.form.pristine) {
      return true;
    }
    return this.confirmDialog.confirm({
      title: 'Discard changes?',
      message: 'You have unsaved changes. Leaving this page will discard them.',
      confirmLabel: 'Discard',
      cancelLabel: 'Stay',
      danger: true,
    });
  }
}
