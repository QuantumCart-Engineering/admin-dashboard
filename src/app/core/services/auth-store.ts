import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../api/auth-api';
import type { AuthUser, LoginRequest, UserRole } from '../models/auth';

const ACCESS_TOKEN_KEY = 'qc_admin_access_token';
const REFRESH_TOKEN_KEY = 'qc_admin_refresh_token';
const USER_KEY = 'qc_admin_user';

export class NotAdminError extends Error {
  constructor() {
    super('This account does not have administrator access.');
    this.name = 'NotAdminError';
  }
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(AuthApi);

  private readonly _accessToken = signal<string | null>(localStorage.getItem(ACCESS_TOKEN_KEY));
  private readonly _refreshToken = signal<string | null>(localStorage.getItem(REFRESH_TOKEN_KEY));
  private readonly _user = signal<AuthUser | null>(this.readUser());

  readonly accessToken = this._accessToken.asReadonly();
  readonly refreshToken = this._refreshToken.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._accessToken());
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');

  private readUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as AuthUser;
      return parsed.role === 'ADMIN' ? parsed : null;
    } catch {
      return null;
    }
  }

  private persistTokens(access: string | null, refresh: string | null) {
    if (access) {
      localStorage.setItem(ACCESS_TOKEN_KEY, access);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
    if (refresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
    this._accessToken.set(access);
    this._refreshToken.set(refresh);
  }

  private persistUser(user: AuthUser | null) {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
    this._user.set(user);
  }

  /**
   * Authenticate an administrator. Regular customers are rejected before any
   * token is persisted, so the admin console never holds a non-admin session.
   */
  async login(payload: LoginRequest): Promise<void> {
    const data = await firstValueFrom(this.api.login(payload));

    if (data.user.role !== 'ADMIN') {
      throw new NotAdminError();
    }

    this.persistTokens(data.accessToken, data.refreshToken);
    this.persistUser(data.user);
  }

  async refresh(): Promise<string | null> {
    const refresh = this._refreshToken();
    if (!refresh) {
      this.logout();
      return null;
    }
    try {
      const data = await firstValueFrom(this.api.refresh({ refreshToken: refresh }));
      this.persistTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      this.logout();
      return null;
    }
  }

  /** Re-validate the stored session against the server (role can change). */
  async loadProfile(): Promise<AuthUser | null> {
    if (!this.isAuthenticated()) {
      return null;
    }
    try {
      const user = await firstValueFrom(this.api.me());
      if (user.role !== 'ADMIN') {
        this.clearSession();
        return null;
      }
      this.persistUser(user);
      return user;
    } catch {
      return null;
    }
  }

  hasRole(role: UserRole): boolean {
    return this._user()?.role === role;
  }

  clearSession(): void {
    this.persistTokens(null, null);
    this.persistUser(null);
  }

  logout(): void {
    const refresh = this._refreshToken();
    if (refresh) {
      firstValueFrom(this.api.logout({ refreshToken: refresh })).catch(() => undefined);
    }
    this.clearSession();
  }
}
