/* Wire DTOs for the Comments feature — same casing rules as the other
 * models files (see blog.models.ts): PascalCase requests, camelCase
 * responses. */

export interface Comment {
  id: number;
  blogPostId: number;
  commentText: string;
  createdBy: string;
  authorName: string;
  authorProfileImagePath: string | null;
  createdDate: string;
  updatedDate: string | null;
}

export interface AddCommentRequest {
  BlogPostId: number;
  CommentText: string;
}

export interface UpdateCommentRequest {
  CommentText: string;
}
