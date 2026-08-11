import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';
import { Category } from '../models/blog.models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly categoriesBase = `${environment.apiBaseUrl}/categories`;

  // The category list is effectively static — share one in-flight/cached
  // request across every subscriber instead of re-fetching per component.
  private readonly categories$ = this.http
    .get<Category[]>(this.categoriesBase)
    .pipe(shareReplay(1));

  getAll(): Observable<Category[]> {
    return this.categories$;
  }
}
