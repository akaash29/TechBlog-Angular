import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Comment } from '../models/comment.models';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly http = inject(HttpClient);
  private readonly commentsBase = `${environment.apiBaseUrl}/comments`;

  getByPost(blogPostId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(this.commentsBase, { params: { blogPostId } });
  }

  add(blogPostId: number, commentText: string): Observable<Comment> {
    return this.http.post<Comment>(this.commentsBase, { BlogPostId: blogPostId, CommentText: commentText });
  }

  update(id: number, commentText: string): Observable<Comment> {
    return this.http.put<Comment>(`${this.commentsBase}/${id}`, { CommentText: commentText });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.commentsBase}/${id}`);
  }
}
