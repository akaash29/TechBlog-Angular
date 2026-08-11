import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BlogPostService } from '../../../app/services/blog-post.service';
import { CategoryService } from '../../../app/services/category.service';
import { BlogPostSummary, Category } from '../../../app/models/blog.models';

/** The feed page's right-hand rail — suggested-for-you, most viewed, most
 *  liked (all from BlogPostsController's /suggested and /top endpoints),
 *  and topics (the Categories table). */
@Component({
  selector: 'app-feed-sidebar',
  imports: [RouterLink],
  templateUrl: './feed-sidebar.html',
  styleUrl: './feed-sidebar.css',
})
export class FeedSidebar {
  private readonly blogPostService = inject(BlogPostService);
  private readonly categoryService = inject(CategoryService);

  protected readonly suggested = signal<BlogPostSummary[]>([]);
  protected readonly mostViewed = signal<BlogPostSummary[]>([]);
  protected readonly mostLiked = signal<BlogPostSummary[]>([]);
  protected readonly topics = signal<Category[]>([]);

  constructor() {
    this.blogPostService.getSuggested(3).subscribe({
      next: (posts) => this.suggested.set(posts),
      error: (err) => console.error('Failed to load suggested posts:', err),
    });

    this.blogPostService.getTop('views', 4).subscribe({
      next: (posts) => this.mostViewed.set(posts),
      error: (err) => console.error('Failed to load most-viewed posts:', err),
    });

    this.blogPostService.getTop('likes', 4).subscribe({
      next: (posts) => this.mostLiked.set(posts),
      error: (err) => console.error('Failed to load most-liked posts:', err),
    });

    this.categoryService.getAll().subscribe({
      next: (categories) => this.topics.set(categories),
      error: (err) => console.error('Failed to load topics:', err),
    });
  }

  /** The level-meter bar's width, relative to the top item in the list. */
  protected barWidth(value: number, list: BlogPostSummary[], metric: 'viewCount' | 'likesCount'): number {
    const max = list[0]?.[metric] ?? 1;
    return Math.max(8, Math.round((value / (max || 1)) * 100));
  }

  /** The cover-art gradient fallback class when a post has no cover image. */
  protected slug(categoryName: string): string {
    return categoryName.toLowerCase().replace(/[^a-z]/g, '');
  }
}
