import { Injectable, signal } from '@angular/core';

/** The Messages nav item's unread badge count — a small shared signal so
 *  Navbar (which renders it) and the Messages page (which recomputes it
 *  from the conversation list whenever that list changes) stay in sync
 *  without either needing a reference to the other.
 *
 *  Deliberately just one method: always *set* the count from a value that
 *  came from the server (either GET /messages/unread-count, or the sum of
 *  each conversation's unreadCount), never nudge it up/down by a guessed
 *  amount client-side. An earlier version had increment()/decrementBy()
 *  calls sprinkled across Navbar and Messages, and they drifted out of
 *  sync with reality — e.g. re-opening a conversation you'd already read
 *  would decrement again, or a message that arrived while its thread was
 *  already open would increment the badge even though it was immediately
 *  marked read. Recomputing from source data sidesteps that whole class
 *  of bug. */
@Injectable({ providedIn: 'root' })
export class MessagesBadgeService {
  private readonly _unreadCount = signal(0);
  readonly unreadCount = this._unreadCount.asReadonly();

  setCount(count: number): void {
    this._unreadCount.set(Math.max(0, count));
  }
}
