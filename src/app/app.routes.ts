import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';
import { AdminShell } from './shared/components/admin-shell/admin-shell';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login-page/login-page').then((m) => m.LoginPage),
    title: 'Sign in — QuantumCart Admin',
  },
  {
    path: '',
    component: AdminShell,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page/dashboard-page').then((m) => m.DashboardPage),
        title: 'Dashboard — QuantumCart Admin',
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/products-list-page/products-list-page').then(
            (m) => m.ProductsListPage,
          ),
        title: 'Products — QuantumCart Admin',
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('./features/products/product-form-page/product-form-page').then(
            (m) => m.ProductFormPage,
          ),
        canDeactivate: [unsavedChangesGuard],
        title: 'New product — QuantumCart Admin',
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./features/products/product-form-page/product-form-page').then(
            (m) => m.ProductFormPage,
          ),
        canDeactivate: [unsavedChangesGuard],
        title: 'Edit product — QuantumCart Admin',
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/categories-page/categories-page').then(
            (m) => m.CategoriesPage,
          ),
        title: 'Categories — QuantumCart Admin',
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./features/inventory/inventory-page/inventory-page').then((m) => m.InventoryPage),
        title: 'Inventory — QuantumCart Admin',
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports-page/reports-page').then((m) => m.ReportsPage),
        title: 'Reports — QuantumCart Admin',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
