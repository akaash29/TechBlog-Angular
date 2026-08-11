import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BlogPostService } from '../../app/services/blog-post.service';
import { CommentService } from '../../app/services/comment.service';
import { CategoryService } from '../../app/services/category.service';
import { AuthService } from '../../app/services/auth.service';
import { ToastService } from '../../app/shared/toast.service';
import { BlogPostDetail, BlogPostSummary, Category } from '../../app/models/blog.models';
import { Comment } from '../../app/models/comment.models';

/** Real data end to end: the post itself, its comments, and the rail's
 *  "most read"/"most discussed" lists all come from the API. Loading this
 *  page records a view; liking bumps LikesCount; adding/editing/deleting a
 *  comment round-trips through CommentService (which also keeps the post's
 *  CommentsCount in sync server-side). */
@Component({
  selector: 'app-post',
  imports: [RouterLink, DatePipe, FormsModule],
  templateUrl: './post.html',
  styleUrl: './post.css',
})
export class Post {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly blogPostService = inject(BlogPostService);
  private readonly commentService = inject(CommentService);
  private readonly categoryService = inject(CategoryService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  protected readonly post = signal<BlogPostDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly liked = signal(false);
  protected readonly liking = signal(false);

  protected readonly comments = signal<Comment[]>([]);
  protected readonly newCommentText = signal('');
  protected readonly postingComment = signal(false);
  protected readonly editingCommentId = signal<number | null>(null);
  protected readonly editingText = signal('');
  protected readonly savingCommentId = signal<number | null>(null);

  protected readonly categories = signal<Category[]>([]);
  protected readonly mostRead = signal<BlogPostSummary[]>([]);
  protected readonly mostDiscussed = signal<BlogPostSummary[]>([]);

  protected readonly currentUserId = computed(() => this.authService.currentUser()?.id ?? null);
  protected readonly isAdmin = computed(() => this.authService.currentUser()?.role === 'Admin');
  protected readonly isLoggedIn = computed(() => this.authService.isAuthenticated());

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id)) {
      this.loading.set(false);
      this.notFound.set(true);
      return;
    }

    this.loadPost(id);
    this.loadComments(id);

    // Best-effort — a failed view count shouldn't block reading the post.
    this.blogPostService.recordView(id).subscribe({ error: () => void 0 });

    // Restores the like button's highlighted state after a reload — see the
    // matching note in Feed.
    this.blogPostService.getLikedPostIds().subscribe({
      next: (ids) => this.liked.set(ids.includes(id)),
      error: (err) => console.error('Failed to load liked posts:', err),
    });

    this.categoryService.getAll().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (err) => console.error('Failed to load categories:', err),
    });
    this.blogPostService.getTop('views', 4).subscribe({
      next: (posts) => this.mostRead.set(posts),
      error: (err) => console.error('Failed to load most-read posts:', err),
    });
    this.blogPostService.getTop('comments', 3).subscribe({
      next: (posts) => this.mostDiscussed.set(posts),
      error: (err) => console.error('Failed to load most-discussed posts:', err),
    });
  }

  protected canModify(comment: Comment): boolean {
    return this.isAdmin() || comment.createdBy === this.currentUserId();
  }

  /** Sends an anonymous reader to sign in, carrying this post as returnUrl
   *  so they land right back here afterwards — used by both the "Login to
   *  add comment" button and the like button when signed out. */
  protected goToLogin(): void {
    void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  protected onLike(): void {
    if (!this.isLoggedIn()) {
      this.goToLogin();
      return;
    }

    const post = this.post();
    if (!post || this.liking()) return;

    this.liking.set(true);
    this.blogPostService.toggleLike(post.id).subscribe({
      next: (result) => {
        this.post.update((p) => (p ? { ...p, likesCount: result.likesCount } : p));
        this.liked.set(result.liked);
        this.liking.set(false);
      },
      error: (err) => {
        console.error('Like failed:', err);
        this.liking.set(false);
      },
    });
  }

  protected submitComment(): void {
    const post = this.post();
    const text = this.newCommentText().trim();
    if (!post || !text || this.postingComment()) return;

    this.postingComment.set(true);
    this.commentService.add(post.id, text).subscribe({
      next: (comment) => {
        this.comments.update((list) => [...list, comment]);
        this.post.update((p) => (p ? { ...p, commentsCount: p.commentsCount + 1 } : p));
        this.newCommentText.set('');
        this.postingComment.set(false);
        void this.toastService.show('Comment posted.', 'success', 2000);
      },
      error: (err) => {
        console.error('Failed to post comment:', err);
        this.postingComment.set(false);
      },
    });
  }

  protected startEditingComment(comment: Comment): void {
    this.editingCommentId.set(comment.id);
    this.editingText.set(comment.commentText);
  }

  protected cancelEditingComment(): void {
    this.editingCommentId.set(null);
    this.editingText.set('');
  }

  protected saveEditedComment(comment: Comment): void {
    const text = this.editingText().trim();
    if (!text || this.savingCommentId()) return;

    this.savingCommentId.set(comment.id);
    this.commentService.update(comment.id, text).subscribe({
      next: (updated) => {
        this.comments.update((list) => list.map((c) => (c.id === updated.id ? updated : c)));
        this.savingCommentId.set(null);
        this.editingCommentId.set(null);
        void this.toastService.show('Comment updated.', 'success', 2000);
      },
      error: (err) => {
        console.error('Failed to update comment:', err);
        this.savingCommentId.set(null);
      },
    });
  }

  protected deleteComment(comment: Comment): void {
    if (!confirm('Delete this comment?')) return;

    this.commentService.delete(comment.id).subscribe({
      next: () => {
        this.comments.update((list) => list.filter((c) => c.id !== comment.id));
        this.post.update((p) => (p ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p));
        void this.toastService.show('Comment deleted.', 'info', 2000);
      },
      error: (err) => console.error('Failed to delete comment:', err),
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

  private loadPost(id: number): void {
    this.loading.set(true);
    this.blogPostService.getById(id).subscribe({
      next: (post) => {
        this.post.set(post);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load post:', err);
        this.loading.set(false);
        this.notFound.set(true);
      },
    });
  }

  private loadComments(id: number): void {
    this.commentService.getByPost(id).subscribe({
      next: (comments) => this.comments.set(comments),
      error: (err) => console.error('Failed to load comments:', err),
    });
  }
}
