import { Component, ElementRef, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BlogPostService } from '../../app/services/blog-post.service';
import { CategoryService } from '../../app/services/category.service';
import { BlogPostSummary, Category } from '../../app/models/blog.models';

/** Real data end to end: BlogPostService talks to /api/blogposts/journal
 *  (newest first, optionally filtered to one category — see
 *  BlogPostsController). "Load more" fetches the next page of 10 as the
 *  sentinel div at the bottom of the grid scrolls into view. */
@Component({
  selector: 'app-journal',
  imports: [RouterLink, DatePipe],
  templateUrl: './journal.html',
  styleUrl: './journal.css',
})
export class Journal implements OnDestroy {
  private readonly blogPostService = inject(BlogPostService);
  private readonly categoryService = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private static readonly PAGE_SIZE = 10;

  protected readonly categories = signal<Category[]>([]);
  protected readonly activeCategoryId = signal<number | null>(null);
  protected readonly posts = signal<BlogPostSummary[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly loading = signal(false);
  protected readonly loadingMore = signal(false);
  protected readonly hasMore = signal(true);

  /** The unfiltered view leads with its first (newest) post as a feature —
   *  same as the original design's lead story slot. Filtered-by-category
   *  views are a plain grid, newest first. */
  protected readonly leadPost = computed(() =>
    this.activeCategoryId() === null && this.posts().length ? this.posts()[0] : null
  );
  protected readonly gridPosts = computed(() => (this.leadPost() ? this.posts().slice(1) : this.posts()));

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
    this.categoryService.getAll().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (err) => console.error('Failed to load categories:', err),
    });

    // Subscribed, not just read once from the snapshot — a routerLink to
    // "/journal?cat=…" from elsewhere (the feed sidebar's topics, the post
    // page's Sections rail) reuses this component instance rather than
    // re-constructing it when you're already on the journal page, so only
    // an active subscription picks up the new query param.
    //
    // `hasLoaded` (not just comparing against activeCategoryId's initial
    // value) is what actually triggers the very first load: with no ?cat=
    // in the URL, the resolved category and the signal's initial value are
    // both null, so a plain "did it change" check would never fire and the
    // page would sit empty until a category was picked.
    let hasLoaded = false;
    this.route.queryParamMap.subscribe((params) => {
      const catParam = params.get('cat');
      const categoryId = catParam ? Number(catParam) : null;
      const resolved = categoryId != null && Number.isFinite(categoryId) ? categoryId : null;

      if (!hasLoaded || resolved !== this.activeCategoryId()) {
        hasLoaded = true;
        this.activeCategoryId.set(resolved);
        this.loadCategory(resolved);
      }
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  protected selectCategory(categoryId: number | null): void {
    if (categoryId === this.activeCategoryId()) return;
    // Drives activeCategoryId via the queryParamMap subscription above —
    // single source of truth, and the choice becomes shareable/bookmarkable.
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { cat: categoryId },
      replaceUrl: true,
    });
  }

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

  private loadCategory(categoryId: number | null): void {
    this.page = 1;
    this.loading.set(true);
    this.blogPostService.getJournal(categoryId, this.page, Journal.PAGE_SIZE).subscribe({
      next: (result) => {
        this.posts.set(result.items);
        this.totalCount.set(result.totalCount);
        this.hasMore.set(result.page * result.pageSize < result.totalCount);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load the journal:', err);
        this.loading.set(false);
      },
    });
  }

  private loadMore(): void {
    if (this.loadingMore() || this.loading() || !this.hasMore()) return;

    this.loadingMore.set(true);
    const nextPage = this.page + 1;
    this.blogPostService.getJournal(this.activeCategoryId(), nextPage, Journal.PAGE_SIZE).subscribe({
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
}
