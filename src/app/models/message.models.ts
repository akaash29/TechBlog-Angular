/* Wire DTOs for the Messages feature — same casing rules as the other
 * models files: PascalCase requests, camelCase responses. */

export interface Message {
  id: number;
  senderId: string;
  senderName: string;
  senderProfileImagePath: string | null;
  recipientId: string;
  text: string | null;
  attachmentUrl: string | null;
  attachmentFileName: string | null;
  attachmentContentType: string | null;
  attachmentSizeBytes: number | null;
  voiceNoteUrl: string | null;
  voiceNoteDurationSeconds: number | null;
  isRead: boolean;
  createdDate: string;
}

/** One row in the conversation list — the other participant, plus a
 *  preview of where things left off. */
export interface Conversation {
  otherUserId: string;
  otherUserName: string;
  otherUserProfileImagePath: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string;
  lastMessageIsMine: boolean;
  unreadCount: number;
  isOnline: boolean;
}

export interface SendMessageRequest {
  RecipientId: string;
  Text?: string | null;
  AttachmentUrl?: string | null;
  AttachmentFileName?: string | null;
  AttachmentContentType?: string | null;
  AttachmentSizeBytes?: number | null;
  VoiceNoteUrl?: string | null;
  VoiceNoteDurationSeconds?: number | null;
}

export interface UploadMessageAttachmentResponse {
  url: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

/** Mirrors the API's MessageAttachmentConstraints — keep these in sync. */
export const MAX_MESSAGE_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MESSAGE_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/zip',
];
