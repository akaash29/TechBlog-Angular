import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../app/services/auth.service';
import { ToastService } from '../../app/shared/toast.service';

const STRENGTH_LABELS = ['Use 8+ characters', 'Weak', 'Getting there', 'Strong', 'Very strong'];

function passwordScore(value: string): number {
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
  return score;
}

function handleFormatValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value as string) ?? '';
  return value === '' || /^[a-z0-9]+$/.test(value) ? null : { handleFormat: true };
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly registerForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    handle: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(50), handleFormatValidator],
    ],
    role: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    terms: [false, [Validators.requiredTrue]],
  });

  protected readonly passwordStrengthLevel = signal(0);
  protected readonly passwordStrengthLabel = signal(STRENGTH_LABELS[0]);
  protected readonly submitting = signal(false);
  /** Carried onto the "Sign in" link so switching to login doesn't lose the
   *  page the visitor was originally headed to. */
  protected readonly loginQueryParams = this.route.snapshot.queryParamMap.get('returnUrl')
    ? { returnUrl: this.route.snapshot.queryParamMap.get('returnUrl') }
    : {};

  protected get firstName() {
    return this.registerForm.controls.firstName;
  }

  protected get lastName() {
    return this.registerForm.controls.lastName;
  }

  protected get handle() {
    return this.registerForm.controls.handle;
  }

  protected get role() {
    return this.registerForm.controls.role;
  }

  protected get email() {
    return this.registerForm.controls.email;
  }

  protected get password() {
    return this.registerForm.controls.password;
  }

  protected get terms() {
    return this.registerForm.controls.terms;
  }

  constructor() {
    // handles are letters and numbers only, lowercased as you type
    this.handle.valueChanges.subscribe((value) => {
      const sanitized = value.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (sanitized !== value) {
        this.handle.setValue(sanitized, { emitEvent: false });
      }
    });

    this.password.valueChanges.subscribe((value) => {
      const level = Math.min(passwordScore(value), STRENGTH_LABELS.length - 1);
      this.passwordStrengthLevel.set(level);
      this.passwordStrengthLabel.set(STRENGTH_LABELS[level]);
    });
  }

  /** Where to send them once they're signed in — same returnUrl the
   *  register route was reached with, or the feed by default. Only ever a
   *  local path: an open redirect via a crafted external returnUrl is
   *  exactly what this guards against. */
  private returnUrl(): string {
    const requested = this.route.snapshot.queryParamMap.get('returnUrl');
    return requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/feed';
  }

  protected onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      void this.toastService.show('Check the highlighted fields.', 'error', 3000);
      return;
    }

    // terms is a UI-only consent gate — the API's RegisterUserRequest has no such field
    const { firstName, lastName, handle, role, email, password } = this.registerForm.getRawValue();

    this.submitting.set(true);
    this.authService
      .register({
        FirstName: firstName,
        LastName: lastName,
        UserName: handle,
        Role: role,
        Email: email,
        Password: password,
      })
      .subscribe({
        next: (user) => {
          console.log(user);
          // registration itself doesn't return a session — the API returns
          // the created profile, not a token pair — so sign the new writer
          // in immediately with the same credentials, keeping "register"
          // feeling like one continuous step into the feed (or wherever they
          // were headed, if they landed here via a returnUrl) rather than a
          // dead end back at the sign-in form.
          this.authService.login({ EmailOrUserName: email, Password: password }).subscribe({
            next: () => {
              void this.toastService
                .show('User registered successfully', 'success', 3000)
                .then(() => this.router.navigateByUrl(this.returnUrl()));
            },
            error: (err) => {
              // registration succeeded even though the follow-up sign-in
              // didn't — don't strand them, just send them to sign in by hand
              console.error('Post-registration sign-in failed:', err);
              this.submitting.set(false);
              void this.toastService
                .show('Account created. Sign in to continue.', 'success', 3000)
                .then(() =>
                  this.router.navigateByUrl(
                    `/login?returnUrl=${encodeURIComponent(this.returnUrl())}`
                  )
                );
            },
          });
        },
        error: (err) => {
          // the error interceptor already surfaced a toast for HTTP failures —
          // this still logs so a non-HTTP failure isn't silently swallowed
          console.error('Registration failed:', err);
          this.submitting.set(false);
        },
      });
  }
}
