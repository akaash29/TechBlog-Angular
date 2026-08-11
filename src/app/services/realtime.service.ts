import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Message } from '../models/message.models';

/** One SignalR connection to MessagesHub, shared app-wide (started once,
 *  from the navbar, whenever someone's signed in — see Navbar). Two
 *  concerns ride this one connection: live message delivery/read-receipts,
 *  and "who's online" presence for the Members page and conversation list.
 *  Every actual write (sending a message, marking a thread read) still goes
 *  through MessageService's REST calls — the hub only pushes results back
 *  out; see MessagesHub's own doc comment on the API side. */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);

  private connection: signalR.HubConnection | null = null;

  private readonly _connected = signal(false);
  readonly connected = this._connected.asReadonly();

  private readonly _onlineUserIds = signal<ReadonlySet<string>>(new Set());
  readonly onlineUserIds = this._onlineUserIds.asReadonly();

  private readonly _messageReceived = new Subject<Message>();
  readonly messageReceived$ = this._messageReceived.asObservable();

  /** Emits the id of whoever just read the caller's messages in a thread. */
  private readonly _threadRead = new Subject<string>();
  readonly threadRead$ = this._threadRead.asObservable();

  connect(): void {
    if (!isPlatformBrowser(this.platformId) || this.connection) return;

    const hubUrl = `${environment.apiBaseUrl.replace(/\/api\/?$/, '')}/hubs/messages`;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => this.authService.getAccessToken() ?? '',
        // The SignalR client defaults this to true (for cookie-auth setups).
        // We authenticate with a bearer token, not cookies, and the API's
        // CORS policy doesn't opt into AllowCredentials — left at its
        // default, the browser silently blocks every negotiate/connect
        // request as a CORS violation, so the hub connection never comes
        // up and "online now" never has anything in it.
        withCredentials: false,
      })
      .withAutomaticReconnect()
      .build();

    this.connection.on('ReceiveMessage', (message: Message) => this._messageReceived.next(message));
    this.connection.on('ThreadRead', (userId: string) => this._threadRead.next(userId));
    this.connection.on('UserOnline', (userId: string) =>
      this._onlineUserIds.update((ids) => new Set(ids).add(userId))
    );
    this.connection.on('UserOffline', (userId: string) =>
      this._onlineUserIds.update((ids) => {
        const next = new Set(ids);
        next.delete(userId);
        return next;
      })
    );
    this.connection.onreconnected(() => this.refreshOnlineUsers());

    this.connection
      .start()
      .then(() => {
        this._connected.set(true);
        return this.refreshOnlineUsers();
      })
      .catch((err) => console.error('Failed to connect to the messages hub:', err));
  }

  disconnect(): void {
    void this.connection?.stop();
    this.connection = null;
    this._connected.set(false);
    this._onlineUserIds.set(new Set());
  }

  private refreshOnlineUsers(): Promise<void> {
    if (!this.connection) return Promise.resolve();
    return this.connection
      .invoke<string[]>('GetOnlineUserIds')
      .then((ids) => this._onlineUserIds.set(new Set(ids)))
      .catch((err) => console.error('Failed to load online presence:', err));
  }
}
