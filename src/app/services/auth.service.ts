import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AuthApiResponse,
  AuthSession,
  AuthUser,
  LoginRequest,
  RegisterRequest,
  RegisteredUser,
} from '../models/auth.models';
import { DOTNET_CLAIM_TYPES, decodeJwtPayload } from '../utils/jwt';

const SESSION_KEY = 'lw_auth_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly authBase = `${environment.apiBaseUrl}/auth`;
  private readonly usersBase = `${environment.apiBaseUrl}/users`;

  private readonly _currentUser = signal<AuthUser | null>(this.readSession()?.user ?? null);
  /** The signed-in user, or null when no session is stored. */
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  /** Shares one in-flight refresh across concurrent 401s instead of firing one per request. */
  private refreshInFlight: Observable<AuthSession> | null = null;

  /** Registers a new writer. The API returns the created profile, not a
   *  token pair — self-registration signs in via a separate login call. */
  register(request: RegisterRequest): Observable<RegisteredUser> {
    return this.http.post<RegisteredUser>(`${this.usersBase}/register`, request);
  }

  /** @param keepSignedIn persists the session across browser restarts
   *  (localStorage) when true, or only for the current tab session
   *  (sessionStorage) when false — mirrors the login form's checkbox. */
  login(request: LoginRequest, keepSignedIn = true): Observable<AuthSession> {
    return this.http.post<AuthApiResponse>(`${this.authBase}/login`, request).pipe(
      map((res) => this.toSession(res)),
      tap((session) => this.storeSession(session, keepSignedIn))
    );
  }

  /** Exchanges the stored refresh token for a new access/refresh pair.
   *  Safe to call from multiple places at once — every caller during a
   *  refresh already in flight gets the same result instead of racing
   *  the API with duplicate requests. */
  refreshAccessToken(): Observable<AuthSession> {
    if (this.refreshInFlight) return this.refreshInFlight;

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available.'));
    }

    const persistent = this.isPersisted();

    this.refreshInFlight = this.http
      .post<AuthApiResponse>(`${this.authBase}/refresh`, { RefreshToken: refreshToken })
      .pipe(
        map((res) => this.toSession(res)),
        tap((session) => this.storeSession(session, persistent)),
        shareReplay(1),
        finalize(() => (this.refreshInFlight = null))
      );

    return this.refreshInFlight;
  }

  /** Revokes the refresh token server-side (if any), then clears the
   *  local session regardless of whether that call succeeds. */
  logout(): Observable<void> {
    const refreshToken = this.getRefreshToken();
    this.clearSession();

    if (!refreshToken) return of(undefined);

    return this.http.post<void>(`${this.authBase}/revoke`, { RefreshToken: refreshToken }).pipe(
      map(() => undefined),
      catchError(() => of(undefined))
    );
  }

  getAccessToken(): string | null {
    return this.readSession()?.accessToken ?? null;
  }

  getRefreshToken(): string | null {
    return this.readSession()?.refreshToken ?? null;
  }

  clearSession(): void {
    this._currentUser.set(null);
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }

  /** Reads the identity straight out of the access token's claims —
   *  it's the source of truth the API just signed, and neither login
   *  nor refresh separately return a user profile. */
  private toSession(res: AuthApiResponse): AuthSession {
    const claims = decodeJwtPayload(res.accessToken) ?? {};

    const user: AuthUser = {
      id: String(claims[DOTNET_CLAIM_TYPES.nameIdentifier] ?? claims['sub'] ?? ''),
      userName: String(claims[DOTNET_CLAIM_TYPES.name] ?? ''),
      email: String(claims[DOTNET_CLAIM_TYPES.email] ?? ''),
      role: String(claims[DOTNET_CLAIM_TYPES.role] ?? ''),
    };

    return {
      accessToken: res.accessToken,
      accessTokenExpiresAt: res.accessTokenExpiresAt,
      refreshToken: res.refreshToken,
      refreshTokenExpiresAt: res.refreshTokenExpiresAt,
      user,
    };
  }

  private storeSession(session: AuthSession, persistent: boolean): void {
    this._currentUser.set(session.user);
    if (!isPlatformBrowser(this.platformId)) return;

    const target = persistent ? localStorage : sessionStorage;
    const other = persistent ? sessionStorage : localStorage;
    other.removeItem(SESSION_KEY);
    target.setItem(SESSION_KEY, JSON.stringify(session));
  }

  private readSession(): AuthSession | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    const raw = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }

  /** Whether the current session lives in localStorage (persistent,
   *  "keep me signed in") rather than sessionStorage — so a silent
   *  refresh preserves the choice made at login. */
  private isPersisted(): boolean {
    return isPlatformBrowser(this.platformId) && !!localStorage.getItem(SESSION_KEY);
  }
}
