import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../shared/toast.service';

/** Surfaces every failed HTTP request as a toast and re-throws so
 *  callers can still react to the error individually if they need to
 *  (e.g. to reset a submit button). */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Background tracking calls are best-effort — a flaky beacon shouldn't
      // interrupt the visitor with an error toast.
      if (!req.url.includes('/analytics/')) {
        void toastService.show(extractMessage(error), 'error', 4000);
      }
      return throwError(() => error);
    })
  );
};

/** ASP.NET Core's GlobalExceptionHandler returns RFC 7807 ProblemDetails
 *  (`{ title, detail, status }`), or a ValidationProblemDetails
 *  (`{ errors: { field: [messages] } }`) for 400s from FluentValidation. */
interface ProblemDetailsBody {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

function extractMessage(error: HttpErrorResponse): string {
  const body = error.error as ProblemDetailsBody | null;

  const firstValidationMessage = body?.errors && Object.values(body.errors)[0]?.[0];
  if (firstValidationMessage) return firstValidationMessage;

  if (body?.detail) return body.detail;
  if (body?.title) return body.title;
  if (error.status === 0) return 'Network error — check your connection and try again.';
  return error.message || `Request failed (${error.status}).`;
}
