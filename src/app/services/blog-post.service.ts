import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AuthorStats,
  BlogPost,
  BlogPostDetail,
  BlogPostSummary,
  CreateBlogPostRequest,
  FeedTab,
  LikeToggleResult,
  PagedResult,
  TopMetric,
} from '../models/blog.models';

@Injectable({ providedIn: 'root' })
export class BlogPostService {
  private readonly http = inject(HttpClient);
  private readonly blogPostsBase = `${environment.apiBaseUrl}/blogposts`;

  create(request: CreateBlogPostRequest): Observable<BlogPost> {
    return this.http.post<BlogPost>(this.blogPostsBase, request);
  }

  /** The feed page's tab-ordered, paged post list — 10 posts per page,
   *  fetched again with an incrementing page number as the reader
   *  scrolls (see Feed's lazy-load). */
  getFeed(tab: FeedTab, page: number, pageSize = 10): Observable<PagedResult<BlogPostSummary>> {
    return this.http.get<PagedResult<BlogPostSummary>>(`${this.blogPostsBase}/feed`, {
      params: { tab, page, pageSize },
    });
  }

  /** The journal page's newest-first, optionally category-filtered, paged post list. */
  getJournal(categoryId: number | null, page: number, pageSize = 10): Observable<PagedResult<BlogPostSummary>> {
    const params: Record<string, string | number> = { page, pageSize };
    if (categoryId != null) {
      params['categoryId'] = categoryId;
    }
    return this.http.get<PagedResult<BlogPostSummary>>(`${this.blogPostsBase}/journal`, { params });
  }

  /** Top posts by a single metric — "most viewed"/"most liked" on the feed
   *  page, "most read"/"most discussed" on the post page. */
  getTop(metric: TopMetric, take = 4): Observable<BlogPostSummary[]> {
    return this.http.get<BlogPostSummary[]>(`${this.blogPostsBase}/top`, { params: { metric, take } });
  }

  getById(id: number): Observable<BlogPostDetail> {
    return this.http.get<BlogPostDetail>(`${this.blogPostsBase}/${id}`);
  }

  /** Fire-and-forget — called once when the post page loads. */
  recordView(id: number): Observable<void> {
    return this.http.post<void>(`${this.blogPostsBase}/${id}/view`, {});
  }

  /** Toggles the signed-in user's like — a second call un-likes it. */
  toggleLike(id: number): Observable<LikeToggleResult> {
    return this.http.post<LikeToggleResult>(`${this.blogPostsBase}/${id}/like`, {});
  }

  /** Every post the signed-in user has liked — fetched once per page load
   *  and cross-referenced locally so the like button renders correctly
   *  highlighted after a reload. Empty (not an error) when signed out. */
  getLikedPostIds(): Observable<number[]> {
    return this.http.get<number[]>(`${this.blogPostsBase}/liked`);
  }

  /** "Suggested for you" — strong pieces from outside the reader's own beat. */
  getSuggested(take = 3): Observable<BlogPostSummary[]> {
    return this.http.get<BlogPostSummary[]>(`${this.blogPostsBase}/suggested`, { params: { take } });
  }

  /** Every post awaiting review, oldest first — admin-only PendingApproval page. */
  getPending(): Observable<BlogPostSummary[]> {
    return this.http.get<BlogPostSummary[]>(`${this.blogPostsBase}/pending`);
  }

  /** Approves a pending post — publishes it. */
  approve(id: number): Observable<BlogPost> {
    return this.http.post<BlogPost>(`${this.blogPostsBase}/${id}/approve`, {});
  }

  /** Rejects a pending post — deletes it and its uploaded images. */
  reject(id: number): Observable<void> {
    return this.http.post<void>(`${this.blogPostsBase}/${id}/reject`, {});
  }

  /** The signed-in caller's own post/reads/comments/likes totals plus a
   *  7-day reads breakdown — the profile page's stat strip. */
  getMyStats(): Observable<AuthorStats> {
    return this.http.get<AuthorStats>(`${this.blogPostsBase}/my-stats`);
  }
}
