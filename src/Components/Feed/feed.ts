import { Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { BlogPostService } from '../../app/services/blog-post.service';
import { AuthService } from '../../app/services/auth.service';
import { BlogPostSummary, FeedTab, LikeToggleResult } from '../../app/models/blog.models';
import { FeedSidebar } from './feed-sidebar/feed-sidebar';

/** Real data end to end: BlogPostService talks to /api/blogposts/feed (tab-
 *  ordered, paged — see BlogPostsController) and /api/blogposts/top (the
 *  hero, always the single most-viewed post regardless of tab). "Load more"
 *  fetches the next page of 10 as the sentinel div at the bottom of the
 *  list scrolls into view. */
@Component({
  selector: 'app-feed',
  imports: [RouterLink, DatePipe, FeedSidebar],
  templateUrl: './feed.html',
  styleUrl: './feed.css',
})
export class Feed implements OnDestroy {
  private readonly blogPostService = inject(BlogPostService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private static readonly PAGE_SIZE = 10;

  protected readonly hero = signal<BlogPostSummary | null>(null);
  protected readonly posts = signal<BlogPostSummary[]>([]);
  protected readonly activeTab = signal<FeedTab>('foryou');
  protected readonly loading = signal(false);
  protected readonly loadingMore = signal(false);
  protected readonly hasMore = signal(true);
  protected readonly likedPostIds = signal<ReadonlySet<number>>(new Set());

  private page = 1;
  private observer?: IntersectionObserver;

  @ViewChild('sentinel')
  private set sentinelRef(el: ElementRef<HTMLElement> | undefined) {
    this.observer?.disconnect();
    if (!el) return;

    this.observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        this.loadMore();
      }
    });
    this.observer.observe(el.nativeElement);
  }

  constructor() {
    this.blogPostService.getTop('views', 1).subscribe({
      next: (top) => this.hero.set(top[0] ?? null),
      error: (err) => console.error('Failed to load the feed hero:', err),
    });

    // Restores which posts the signed-in reader has already liked — without
    // this, the like button would forget its highlighted state (and let you
    // "like" the same post over and over) every time the page reloads.
    this.blogPostService.getLikedPostIds().subscribe({
      next: (ids) => this.likedPostIds.set(new Set(ids)),
      error: (err) => console.error('Failed to load liked posts:', err),
    });

    this.loadTab('foryou');
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  protected selectTab(tab: FeedTab): void {
    if (tab === this.activeTab()) return;
    this.activeTab.set(tab);
    this.loadTab(tab);
  }

  protected onLike(post: BlogPostSummary, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.authService.isAuthenticated()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.blogPostService.toggleLike(post.id).subscribe({
      next: (result) => this.applyLike(post.id, result),
      error: (err) => console.error('Like failed:', err),
    });
  }

  protected isLiked(postId: number): boolean {
    return this.likedPostIds().has(postId);
  }

  /** Same fallback the vendored templates used for the cover art gradient
   *  when there's no cover image — a CSS class derived from the category name. */
  protected slug(categoryName: string): string {
    return categoryName.toLowerCase().replace(/[^a-z]/g, '');
  }

  protected initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  private loadTab(tab: FeedTab): void {
    this.page = 1;
    this.loading.set(true);
    this.blogPostService.getFeed(tab, this.page, Feed.PAGE_SIZE).subscribe({
      next: (result) => {
        this.posts.set(result.items);
        this.hasMore.set(result.page * result.pageSize < result.totalCount);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load the feed:', err);
        this.loading.set(false);
      },
    });
  }

  private loadMore(): void {
    if (this.loadingMore() || this.loading() || !this.hasMore()) return;

    this.loadingMore.set(true);
    const nextPage = this.page + 1;
    this.blogPostService.getFeed(this.activeTab(), nextPage, Feed.PAGE_SIZE).subscribe({
      next: (result) => {
        this.page = nextPage;
        this.posts.update((current) => [...current, ...result.items]);
        this.hasMore.set(nextPage * result.pageSize < result.totalCount);
        this.loadingMore.set(false);
      },
      error: (err) => {
        console.error('Failed to load more posts:', err);
        this.loadingMore.set(false);
      },
    });
  }

  private applyLike(postId: number, result: LikeToggleResult): void {
    this.posts.update((list) => list.map((p) => (p.id === postId ? { ...p, likesCount: result.likesCount } : p)));
    this.hero.update((h) => (h && h.id === postId ? { ...h, likesCount: result.likesCount } : h));
    this.likedPostIds.update((ids) => {
      const next = new Set(ids);
      if (result.liked) {
        next.add(postId);
      } else {
        next.delete(postId);
      }
      return next;
    });
  }
}
