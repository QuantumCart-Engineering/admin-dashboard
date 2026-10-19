import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/app-config';
import { AuthStore, NotAdminError } from './auth-store';

const ACCESS_KEY = 'qc_admin_access_token';
const REFRESH_KEY = 'qc_admin_refresh_token';
const USER_KEY = 'qc_admin_user';

describe('AuthStore', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://test' },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  const store = () => TestBed.inject(AuthStore);

  const flushLogin = (role: 'ADMIN' | 'CUSTOMER') => {
    http.expectOne('http://test/api/v1/auth/login').flush({
      success: true,
      message: 'ok',
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'u1',
          email: 'user@example.com',
          phone: '123',
          firstName: 'Ada',
          lastName: 'Lovelace',
          role,
        },
      },
    });
  };

  it('starts unauthenticated', () => {
    expect(store().isAuthenticated()).toBe(false);
    expect(store().isAdmin()).toBe(false);
  });

  it('accepts an administrator and persists admin-scoped tokens', async () => {
    const promise = store().login({ email: 'a@b.com', password: 'secret' });
    flushLogin('ADMIN');

    await promise;

    expect(store().isAuthenticated()).toBe(true);
    expect(store().isAdmin()).toBe(true);
    expect(store().user()?.role).toBe('ADMIN');
    expect(localStorage.getItem(ACCESS_KEY)).toBe('access-token');
    expect(localStorage.getItem(REFRESH_KEY)).toBe('refresh-token');
  });

  it('rejects a customer before persisting any session', async () => {
    const promise = store().login({ email: 'c@b.com', password: 'secret' });
    flushLogin('CUSTOMER');

    await expect(promise).rejects.toBeInstanceOf(NotAdminError);

    expect(store().isAuthenticated()).toBe(false);
    expect(store().isAdmin()).toBe(false);
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });

  it('ignores a non-admin user stored in localStorage', () => {
    localStorage.setItem(ACCESS_KEY, 'stale');
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({ id: 'u2', email: 'c@b.com', role: 'CUSTOMER' }),
    );

    expect(store().isAuthenticated()).toBe(true);
    expect(store().isAdmin()).toBe(false);
  });

  it('clears the session on logout', async () => {
    const login = store().login({ email: 'a@b.com', password: 'secret' });
    flushLogin('ADMIN');
    await login;

    store().logout();
    http.expectOne('http://test/api/v1/auth/logout').flush({ success: true, message: 'bye' });

    expect(store().isAuthenticated()).toBe(false);
    expect(store().isAdmin()).toBe(false);
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
  });
});
