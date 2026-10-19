import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthStore, NotAdminError } from '../../../core/services/auth-store';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notify = inject(NotificationService);

  readonly loading = signal(false);
  readonly showPassword = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  private readonly returnUrl = this.safeUrl(
    this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard',
  );

  emailInvalid(): boolean {
    const c = this.form.controls.email;
    return c.touched && c.invalid;
  }

  passwordInvalid(): boolean {
    const c = this.form.controls.password;
    return c.touched && c.invalid;
  }

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  private safeUrl(url: string): string {
    return url.startsWith('/') && !url.startsWith('//') ? url : '/dashboard';
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    try {
      await this.auth.login({
        email: this.form.value.email!,
        password: this.form.value.password!,
      });
      this.notify.showSuccess('Signed in successfully');
      await this.router.navigateByUrl(this.returnUrl);
    } catch (err) {
      if (err instanceof NotAdminError) {
        this.notify.showError(err.message);
      } else if (err instanceof HttpErrorResponse && err.status === 401) {
        this.notify.showError('Invalid email or password.');
      }
      // Any other error is surfaced by the HTTP error interceptor.
    } finally {
      this.loading.set(false);
    }
  }
}
