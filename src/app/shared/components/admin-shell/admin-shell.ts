import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthStore } from '../../../core/services/auth-store';
import { ConfirmDialogService } from '../confirm-dialog/confirm-dialog.service';
import { initials } from '../../../core/utils/placeholder';

interface NavItem {
  label: string;
  link: string;
  icon: string;
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.css',
})
export class AdminShell {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly navOpen = signal(false);
  readonly user = this.auth.user;
  readonly userInitials = computed(() => initials(this.displayName()));

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', link: '/dashboard', icon: 'grid' },
    { label: 'Reports', link: '/reports', icon: 'report' },
    { label: 'Products', link: '/products', icon: 'box' },
    { label: 'Categories', link: '/categories', icon: 'tag' },
    { label: 'Inventory', link: '/inventory', icon: 'layers' },
  ];

  private readonly _pageTitle = signal('Dashboard');
  readonly pageTitle = this._pageTitle.asReadonly();

  constructor() {
    this.updateTitle(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.updateTitle(e.urlAfterRedirects);
        this.navOpen.set(false);
      });
  }

  displayName(): string {
    const user = this.user();
    if (!user) {
      return 'Administrator';
    }
    const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return name || user.email;
  }

  toggleNav() {
    this.navOpen.update((open) => !open);
  }

  closeNav() {
    this.navOpen.set(false);
  }

  private updateTitle(url: string) {
    const segment = url.split('?')[0].split('/').filter(Boolean)[0] ?? 'dashboard';
    const match = this.navItems.find((item) => item.link === `/${segment}`);
    this._pageTitle.set(match ? match.label : 'Dashboard');
  }

  async logout() {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Sign out',
      message: 'Are you sure you want to sign out of the admin console?',
      confirmLabel: 'Sign out',
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
