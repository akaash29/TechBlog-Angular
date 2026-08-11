/* Wire DTOs for the blog/compose feature — same casing rules as
 * auth.models.ts: PascalCase request bodies (case-insensitive model
 * binding), camelCase responses (System.Text.Json's default output). */

export interface Category {
  id: number;
  name: string;
}

export interface UploadImageResponse {
  id: number;
  imagePath: string;
}

export interface CreateBlogPostRequest {
  Title: string;
  Description: string;
  PostHtml: string;
  CoverImagePath: string | null;
  CategoryId: number;
  IsDraft: boolean;
}

/** A post's place in the editorial workflow — mirrors the API's
 *  BlogPostStatus enum, serialized as its name (System.Text.Json's default
 *  enum-as-string-when-ToString'd behaviour, since the API sends it through
 *  Enum.ToString() rather than a numeric value). */
export type BlogPostStatus = 'Draft' | 'PendingApproval' | 'Published';

export interface BlogPost {
  id: number;
  header: string;
  title: string;
  description: string;
  postHtml: string;
  coverImagePath: string | null;
  status: BlogPostStatus;
  likesCount: number;
  commentsCount: number;
  viewCount: number;
  categoryId: number;
  categoryName: string;
  createdBy: string;
  createdDate: string;
  updatedDate: string | null;
}

/** The shape used for every post card — feed, journal, and the "most
 *  viewed"/"most liked"/"most discussed" rails. */
export interface BlogPostSummary {
  id: number;
  header: string;
  title: string;
  description: string;
  coverImagePath: string | null;
  status: BlogPostStatus;
  likesCount: number;
  commentsCount: number;
  viewCount: number;
  categoryId: number;
  categoryName: string;
  createdBy: string;
  authorName: string;
  authorProfileImagePath: string | null;
  createdDate: string;
}

/** The full post, as read on the post page. */
export interface BlogPostDetail extends BlogPostSummary {
  postHtml: string;
  updatedDate: string | null;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export type FeedTab = 'foryou' | 'latest' | 'trending';
export type TopMetric = 'views' | 'likes' | 'comments';

export interface LikeToggleResult {
  liked: boolean;
  likesCount: number;
}

export interface DailyReadCount {
  date: string;
  count: number;
}

/** The profile page's stat strip — the signed-in writer's own Published
 *  posts and the engagement they've drawn. */
export interface AuthorStats {
  posts: number;
  reads: number;
  comments: number;
  likes: number;
  /** Always exactly 7 entries, oldest first, today last — a day with no
   *  reads still has an entry, at count 0. */
  readsThisWeek: DailyReadCount[];
}
