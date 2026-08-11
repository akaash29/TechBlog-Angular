import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { UpdateUserRequest, UserProfile } from '../models/auth.models';
import { PagedResult } from '../models/blog.models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly usersBase = `${environment.apiBaseUrl}/users`;

  /** The signed-in user's full profile — phone/city/photo aren't in the JWT
   *  (see AuthUser), so this is fetched separately and shared app-wide so
   *  the navbar avatar and My Profile page stay in sync off one source. */
  private readonly _currentProfile = signal<UserProfile | null>(null);
  readonly currentProfile = this._currentProfile.asReadonly();

  getById(id: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.usersBase}/${id}`);
  }

  /** The Members page's paged, searchable, role-filterable roster. */
  getPaged(page: number, pageSize: number, role?: string | null, search?: string | null): Observable<PagedResult<UserProfile>> {
    const params: Record<string, string | number> = { page, pageSize };
    if (role) {
      params['role'] = role;
    }
    if (search) {
      params['search'] = search;
    }
    return this.http.get<PagedResult<UserProfile>>(`${this.usersBase}/paged`, { params });
  }

  update(id: string, request: UpdateUserRequest): Observable<UserProfile> {
    return this.http
      .put<UserProfile>(`${this.usersBase}/${id}`, request)
      .pipe(tap((profile) => this._currentProfile.set(profile)));
  }

  uploadProfileImage(id: string, file: File): Observable<UserProfile> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http
      .post<UserProfile>(`${this.usersBase}/${id}/profile-image`, formData)
      .pipe(tap((profile) => this._currentProfile.set(profile)));
  }

  /** Fetches and caches the signed-in user's full profile. Safe to call from
   *  multiple places (e.g. both the navbar and My Profile) — every caller
   *  just re-fetches and the signal converges to the latest response. */
  loadCurrentProfile(id: string): void {
    this.getById(id).subscribe({
      next: (profile) => this._currentProfile.set(profile),
      error: (err) => console.error('Failed to load current profile:', err),
    });
  }

  clearCurrentProfile(): void {
    this._currentProfile.set(null);
  }
}
