import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Conversation, Message, SendMessageRequest, UploadMessageAttachmentResponse } from '../models/message.models';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly http = inject(HttpClient);
  private readonly messagesBase = `${environment.apiBaseUrl}/messages`;

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.messagesBase}/conversations`);
  }

  getThread(otherUserId: string, take = 50): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.messagesBase}/thread/${otherUserId}`, { params: { take } });
  }

  send(request: SendMessageRequest): Observable<Message> {
    return this.http.post<Message>(this.messagesBase, request);
  }

  /** @param kind 'file' for a regular attachment, 'voice' for a recorded note. */
  uploadAttachment(recipientId: string, file: File, kind: 'file' | 'voice'): Observable<UploadMessageAttachmentResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('recipientId', recipientId);
    formData.append('kind', kind);
    return this.http.post<UploadMessageAttachmentResponse>(`${this.messagesBase}/attachments`, formData);
  }

  markThreadRead(otherUserId: string): Observable<void> {
    return this.http.post<void>(`${this.messagesBase}/thread/${otherUserId}/read`, {});
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.messagesBase}/unread-count`);
  }
}
