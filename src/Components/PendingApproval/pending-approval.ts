import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BlogPostService } from '../../app/services/blog-post.service';
import { ToastService } from '../../app/shared/toast.service';
import { BlogPostSummary } from '../../app/models/blog.models';

/** Admin-only. Real data end to end: BlogPostService talks to
 *  GET /api/blogposts/pending, POST .../approve and POST .../reject (see
 *  BlogPostsController) — a writer's "Publish" lands here instead of going
 *  live until an admin acts on it (see CreateBlogPostCommandHandler). */
@Component({
  selector: 'app-pending-approval',
  imports: [RouterLink, DatePipe],
  templateUrl: './pending-approval.html',
  styleUrl: './pending-approval.css',
})
export class PendingApproval {
  private readonly blogPostService = inject(BlogPostService);
  private readonly toastService = inject(ToastService);

  protected readonly posts = signal<BlogPostSummary[]>([]);
  protected readonly loading = signal(true);
  /** The id currently mid-approve/reject — disables just that row's buttons
   *  rather than the whole page while the request is in flight. */
  protected readonly actingOnId = signal<number | null>(null);

  constructor() {
    this.load();
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

  protected approve(post: BlogPostSummary): void {
    if (this.actingOnId()) return;

    this.actingOnId.set(post.id);
    this.blogPostService.approve(post.id).subscribe({
      next: () => {
        this.posts.update((list) => list.filter((p) => p.id !== post.id));
        this.actingOnId.set(null);
        void this.toastService.show(`Published "${post.title}".`, 'success', 2500);
      },
      error: (err) => {
        console.error('Failed to approve post:', err);
        this.actingOnId.set(null);
      },
    });
  }

  protected reject(post: BlogPostSummary): void {
    if (this.actingOnId()) return;
    if (!confirm(`Reject "${post.title}"? This deletes the post and any images it uploaded — this can't be undone.`)) {
      return;
    }

    this.actingOnId.set(post.id);
    this.blogPostService.reject(post.id).subscribe({
      next: () => {
        this.posts.update((list) => list.filter((p) => p.id !== post.id));
        this.actingOnId.set(null);
        void this.toastService.show(`Rejected "${post.title}".`, 'info', 2500);
      },
      error: (err) => {
        console.error('Failed to reject post:', err);
        this.actingOnId.set(null);
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.blogPostService.getPending().subscribe({
      next: (posts) => {
        this.posts.set(posts);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load pending posts:', err);
        this.loading.set(false);
      },
    });
  }
}
