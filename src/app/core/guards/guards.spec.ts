import { TestBed } from '@angular/core/testing';
import { CanActivateFn, provideRouter, UrlTree } from '@angular/router';
import { adminGuard } from './admin.guard';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';

const ACCESS_KEY = 'qc_admin_access_token';
const USER_KEY = 'qc_admin_user';

const seedAdmin = () => {
  localStorage.setItem(ACCESS_KEY, 'token');
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({ id: 'u1', email: 'a@b.com', role: 'ADMIN' }),
  );
};

const seedCustomer = () => {
  localStorage.setItem(ACCESS_KEY, 'token');
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({ id: 'u1', email: 'c@b.com', role: 'CUSTOMER' }),
  );
};

describe('route guards', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  afterEach(() => localStorage.clear());

  const run = (guard: CanActivateFn, url = '/products') =>
    TestBed.runInInjectionContext(() => guard({} as never, { url } as never));

  it('authGuard allows a session', () => {
    seedAdmin();
    expect(run(authGuard)).toBe(true);
  });

  it('authGuard redirects to login when there is no session', () => {
    const result = run(authGuard, '/reports');

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login?returnUrl=%2Freports');
  });

  it('adminGuard allows an administrator', () => {
    seedAdmin();
    expect(run(adminGuard)).toBe(true);
  });

  it('adminGuard drops an unauthenticated visitor and redirects to login', () => {
    const result = run(adminGuard, '/inventory');

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login?returnUrl=%2Finventory');
  });

  it('adminGuard drops a customer, clears the session and redirects to login', () => {
    seedCustomer();
    const result = run(adminGuard, '/reports');

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login?returnUrl=%2Freports');
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });

  it('adminGuard rejects a token without a stored admin identity', () => {
    localStorage.setItem(ACCESS_KEY, 'stale-token');
    const result = run(adminGuard);

    expect(result).toBeInstanceOf(UrlTree);
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
  });

  it('guestGuard keeps an administrator off the login page', () => {
    seedAdmin();
    const result = run(guestGuard);
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toContain('/dashboard');
  });

  it('guestGuard lets a visitor reach the login page', () => {
    expect(run(guestGuard)).toBe(true);
  });

  it('guestGuard allows a customer to reach the admin login page', () => {
    seedCustomer();
    expect(run(guestGuard)).toBe(true);
  });
});
