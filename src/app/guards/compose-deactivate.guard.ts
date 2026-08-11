import { CanDeactivateFn } from '@angular/router';

/** Anything the compose page wants gated behind "are you sure" on the way
 *  out — implemented by Compose itself, since only it knows whether
 *  there are unsaved changes and how to discard them. */
export interface ComposeCanDeactivate {
  canDeactivate(): boolean | Promise<boolean>;
}

/** Runs on every attempt to navigate away from /compose — clicking a nav
 *  link, browser back, another route's redirect, all of it — not just the
 *  Clear button (which asks the same question directly, inline). */
export const composeDeactivateGuard: CanDeactivateFn<ComposeCanDeactivate> = (component) =>
  component.canDeactivate();
