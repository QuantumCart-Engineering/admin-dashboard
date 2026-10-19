import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CategoryApi } from '../../../core/api/category-api';
import type { Category } from '../../../core/models/catalog';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../shared/components/error-state/error-state';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { categoryStatusLabel, categoryStatusTone, toneClass } from '../../../core/utils/status';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [ReactiveFormsModule, EmptyState, ErrorState, Skeleton],
  templateUrl: './categories-page.html',
  styleUrl: './categories-page.css',
})
export class CategoriesPage implements OnInit {
  private readonly categoryApi = inject(CategoryApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);

  readonly formOpen = signal(false);
  readonly editing = signal<Category | null>(null);
  readonly saving = signal(false);

  readonly toneClass = toneClass;
  readonly categoryStatusLabel = categoryStatusLabel;
  readonly categoryStatusTone = categoryStatusTone;

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    description: new FormControl('', { nonNullable: true }),
    parentId: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    void this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set(false);
    try {
      const categories = await firstValueFrom(this.categoryApi.list());
      this.categories.set(categories);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  parentName(parentId: string | null): string {
    if (!parentId) {
      return '—';
    }
    return this.categories().find((c) => c.id === parentId)?.name ?? 'Unknown';
  }

  /** Parent options excluding the category being edited (backend rejects cycles). */
  parentOptions(): Category[] {
    const current = this.editing();
    return this.categories().filter((c) => c.id !== current?.id);
  }

  openCreate() {
    this.editing.set(null);
    this.form.reset({ name: '', description: '', parentId: '' });
    this.formOpen.set(true);
  }

  openEdit(category: Category) {
    this.editing.set(category);
    this.form.reset({
      name: category.name,
      description: category.description ?? '',
      parentId: category.parentId ?? '',
    });
    this.formOpen.set(true);
  }

  closeForm() {
    this.formOpen.set(false);
    this.editing.set(null);
  }

  nameError(): boolean {
    const control = this.form.controls.name;
    return control.invalid && (control.touched || control.dirty);
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const description = raw.description.trim();
    const parentId = raw.parentId || undefined;
    const editing = this.editing();

    try {
      if (editing) {
        await firstValueFrom(
          this.categoryApi.update(editing.id, {
            name: raw.name.trim(),
            description: description.length ? description : undefined,
            parentId: raw.parentId || null,
          }),
        );
        this.notify.showSuccess('Category updated');
      } else {
        await firstValueFrom(
          this.categoryApi.create({
            name: raw.name.trim(),
            description: description.length ? description : undefined,
            parentId,
          }),
        );
        this.notify.showSuccess('Category created');
      }
      this.closeForm();
      await this.load();
    } catch {
      // error interceptor surfaces the message (e.g. duplicate name, bad hierarchy)
    } finally {
      this.saving.set(false);
    }
  }

  async remove(category: Category) {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete category',
      message: `“${category.name}” will be deactivated (soft-deleted) and hidden from the storefront.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    try {
      await firstValueFrom(this.categoryApi.remove(category.id));
      this.notify.showSuccess('Category deleted');
      this.categories.update((list) => list.filter((c) => c.id !== category.id));
    } catch {
      // error interceptor surfaces the message
    }
  }
}
