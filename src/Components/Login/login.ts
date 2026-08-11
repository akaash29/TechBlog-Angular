import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../app/services/auth.service';
import { ToastService } from '../../app/shared/toast.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    keepSignedIn: [true],
  });

  protected readonly submitting = signal(false);
  /** Carried onto the "Create an account" link so switching to register
   *  doesn't lose the page the visitor was originally headed to. */
  protected readonly registerQueryParams = this.route.snapshot.queryParamMap.get('returnUrl')
    ? { returnUrl: this.route.snapshot.queryParamMap.get('returnUrl') }
    : {};

  protected get email() {
    return this.loginForm.controls.email;
  }

  protected get password() {
    return this.loginForm.controls.password;
  }

  /** Where to send a successful sign-in — back to whatever page the
   *  authGuard/adminGuard redirected them from, or the feed by default. Only
   *  ever a local path: an open redirect via a crafted external returnUrl is
   *  exactly what this guards against. */
  private returnUrl(): string {
    const requested = this.route.snapshot.queryParamMap.get('returnUrl');
    // A single leading "/" is a local path; "//" is a protocol-relative URL
    // (e.g. "//evil.com") that browsers would happily treat as external.
    return requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/feed';
  }

  protected onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      void this.toastService.show('Check the highlighted fields.', 'error', 3000);
      return;
    }

    const { email, password, keepSignedIn } = this.loginForm.getRawValue();

    this.submitting.set(true);
    this.authService
      .login({ EmailOrUserName: email, Password: password }, keepSignedIn)
      .subscribe({
        next: (session) => {
          // submitting stays true (button stays disabled) for the whole toast wait
          console.log(session);
          void this.toastService.show('Signed in.', 'success', 1800).then(() => {
            this.router.navigateByUrl(this.returnUrl());
          });
        },
        error: (err) => {
          // the error interceptor already surfaced a toast for HTTP failures —
          // this still logs so a non-HTTP failure (e.g. in the response mapping)
          // isn't silently swallowed
          console.error('Login failed:', err);
          this.submitting.set(false);
        },
      });
  }
}
